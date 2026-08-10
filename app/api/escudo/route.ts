import { NextRequest, NextResponse } from "next/server"

const MAX_REDIRECTS = 3
const MAX_URL_LENGTH = 2_048
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308])
const ALLOWED_IMAGE_TYPES = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
])

type AllowedOrigin = {
  origin: string
  referer: string
}

type SafeTarget = AllowedOrigin & {
  url: string
}

/**
 * Seleciona uma origem fixa controlada pela aplicação. Não reutilize o host
 * recebido na URL: além de evitar SSRF, esta forma é reconhecida pelo CodeQL
 * como uma seleção entre destinos confiáveis.
 */
function allowedOrigin(hostname: string): AllowedOrigin | null {
  const host = hostname.toLowerCase().replace(/^www\./, "")

  switch (host) {
    case "admfutsal.com.br":
      return {
        origin: "https://admfutsal.com.br",
        referer: "https://eventos.admfutsal.com.br/",
      }
    case "eventos.admfutsal.com.br":
      return {
        origin: "https://eventos.admfutsal.com.br",
        referer: "https://eventos.admfutsal.com.br/",
      }
    case "logodetimes.com":
      return {
        origin: "https://logodetimes.com",
        referer: "https://logodetimes.com/",
      }
    case "upload.wikimedia.org":
      return {
        origin: "https://upload.wikimedia.org",
        referer: "https://upload.wikimedia.org/",
      }
    default:
      return null
  }
}

function pathAllowed(origin: AllowedOrigin, pathname: string): boolean {
  if (
    origin.origin === "https://admfutsal.com.br" ||
    origin.origin === "https://eventos.admfutsal.com.br"
  ) {
    return pathname.includes("/escudo/") || pathname.includes("/foto/")
  }
  if (origin.origin === "https://logodetimes.com") {
    return pathname.startsWith("/times/") && /logo-/i.test(pathname)
  }
  if (origin.origin === "https://upload.wikimedia.org") {
    return pathname.startsWith("/wikipedia/")
  }
  return false
}

/**
 * Codifica cada parte separadamente para impedir que barras, `..`, `?` ou `#`
 * escapem do caminho validado. `encodeURIComponent` também atua como barreira
 * de taint para a regra js/request-forgery do CodeQL.
 */
function safePathname(pathname: string): string | null {
  const safeSegments: string[] = []

  for (const segment of pathname.split("/")) {
    let decoded: string
    try {
      decoded = decodeURIComponent(segment)
    } catch {
      return null
    }

    if (
      decoded === "." ||
      decoded === ".." ||
      decoded.includes("/") ||
      decoded.includes("\\") ||
      /[\u0000-\u001f\u007f]/.test(decoded)
    ) {
      return null
    }

    safeSegments.push(encodeURIComponent(decoded))
  }

  return safeSegments.join("/")
}

function safeSearch(searchParams: URLSearchParams): string {
  const entries: string[] = []
  for (const [key, value] of searchParams) {
    entries.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
  }
  return entries.length > 0 ? `?${entries.join("&")}` : ""
}

/** Converte uma URL analisada em um destino HTTPS canônico e permitido. */
function sanitizeTarget(target: URL): SafeTarget | null {
  if (
    !["http:", "https:"].includes(target.protocol) ||
    target.username !== "" ||
    target.password !== "" ||
    target.port !== ""
  ) {
    return null
  }

  const origin = allowedOrigin(target.hostname)
  if (!origin || !pathAllowed(origin, target.pathname)) return null

  const pathname = safePathname(target.pathname)
  if (pathname === null) return null

  const url = `${origin.origin}${pathname}${safeSearch(target.searchParams)}`
  if (url.length > MAX_URL_LENGTH) return null

  return { ...origin, url }
}

async function fetchAllowedTarget(initialTarget: SafeTarget): Promise<Response> {
  let target = initialTarget

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    const upstream = await fetch(target.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: target.referer,
      },
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 60 * 60 * 24 * 7 },
    })

    if (!REDIRECT_STATUSES.has(upstream.status)) return upstream

    const location = upstream.headers.get("location")
    if (!location || redirects === MAX_REDIRECTS) {
      throw new Error("invalid upstream redirect")
    }

    let redirectUrl: URL
    try {
      redirectUrl = new URL(location, target.url)
    } catch {
      throw new Error("invalid upstream redirect")
    }

    const safeRedirect = sanitizeTarget(redirectUrl)
    if (!safeRedirect) throw new Error("unsafe upstream redirect")
    target = safeRedirect
  }

  throw new Error("too many upstream redirects")
}

/**
 * Proxy de escudos — contorna hotlink e permite cache.
 * GET /api/escudo?u=https://...
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("u")
  if (!raw) {
    return NextResponse.json({ error: "missing u" }, { status: 400 })
  }
  if (raw.length > MAX_URL_LENGTH) {
    return NextResponse.json({ error: "invalid url" }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 })
  }

  const target = sanitizeTarget(parsed)
  if (!target) {
    return NextResponse.json({ error: "host/path not allowed" }, { status: 403 })
  }

  try {
    const upstream = await fetchAllowedTarget(target)

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "upstream failed", status: upstream.status },
        { status: 502 },
      )
    }

    const contentType = (upstream.headers.get("content-type") || "")
      .split(";", 1)[0]
      .trim()
      .toLowerCase()
    if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
      return NextResponse.json({ error: "not an image" }, { status: 502 })
    }

    const contentLength = Number(upstream.headers.get("content-length"))
    if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "image too large" }, { status: 502 })
    }

    const buf = await upstream.arrayBuffer()
    if (buf.byteLength < 50 || buf.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "invalid image size" }, { status: 502 })
    }

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch {
    return NextResponse.json({ error: "fetch failed" }, { status: 502 })
  }
}
