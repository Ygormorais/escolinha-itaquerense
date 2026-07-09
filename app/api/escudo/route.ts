import { NextRequest, NextResponse } from "next/server"

/** Hosts permitidos para proxy de escudos. */
const ALLOWED_HOSTS = new Set([
  "admfutsal.com.br",
  "eventos.admfutsal.com.br",
  "logodetimes.com",
  "upload.wikimedia.org",
])

function pathAllowed(host: string, pathname: string): boolean {
  if (host === "admfutsal.com.br" || host === "eventos.admfutsal.com.br") {
    return pathname.includes("/escudo/") || pathname.includes("/foto/")
  }
  if (host === "logodetimes.com") {
    return pathname.startsWith("/times/") && /logo-/i.test(pathname)
  }
  if (host === "upload.wikimedia.org") {
    return pathname.includes("/wikipedia/")
  }
  return false
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

  let target: URL
  try {
    target = new URL(raw)
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 })
  }

  const host = target.hostname.replace(/^www\./, "").toLowerCase()
  if (!ALLOWED_HOSTS.has(host) || !pathAllowed(host, target.pathname)) {
    return NextResponse.json({ error: "host/path not allowed" }, { status: 403 })
  }

  // Prefer https
  if (target.protocol === "http:") target.protocol = "https:"

  try {
    const upstream = await fetch(target.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer:
          host.includes("admfutsal")
            ? "https://eventos.admfutsal.com.br/"
            : `https://${host}/`,
      },
      next: { revalidate: 60 * 60 * 24 * 7 },
    })

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "upstream failed", status: upstream.status },
        { status: 502 },
      )
    }

    const contentType = upstream.headers.get("content-type") || "image/png"
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "not an image" }, { status: 502 })
    }

    const buf = await upstream.arrayBuffer()
    if (buf.byteLength < 50) {
      return NextResponse.json({ error: "empty image" }, { status: 502 })
    }

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
      },
    })
  } catch {
    return NextResponse.json({ error: "fetch failed" }, { status: 502 })
  }
}
