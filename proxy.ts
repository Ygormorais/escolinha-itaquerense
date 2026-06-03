import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSessionSecret } from "@/lib/env"

const COOKIE_NAME = "escolinha_session"

async function verify(signed: string): Promise<boolean> {
  const secret = getSessionSecret()
  const lastDot = signed.lastIndexOf(".")
  if (lastDot === -1) return false

  const value = signed.slice(0, lastDot)
  const providedHex = signed.slice(lastDot + 1)

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )

  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))
  const expectedHex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  if (expectedHex.length !== providedHex.length) return false

  // timing-safe comparison
  let diff = 0
  for (let i = 0; i < expectedHex.length; i++) {
    diff |= expectedHex.charCodeAt(i) ^ providedHex.charCodeAt(i)
  }
  if (diff !== 0) return false

  return value.startsWith("auth:")
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-pathname", pathname)

  const nextResponse = () =>
    NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

  // Usuário já autenticado não deve ver a página de login — redireciona para o
  // painel. Feito aqui (middleware = 307 confiável) porque o redirect() de
  // Server Component nesta versão do Next emite apenas um meta-refresh que não
  // dispara de forma confiável após a hidratação.
  if (pathname === "/login") {
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (token && (await verify(token))) {
      const url = request.nextUrl.clone()
      url.pathname = "/"
      url.search = ""
      return NextResponse.redirect(url)
    }
    return nextResponse()
  }

  if (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/responsavel") ||
    pathname.startsWith("/api/whatsapp/webhook") ||
    pathname.startsWith("/api/config/public") ||
    pathname.startsWith("/api/upload/matricula") ||
    pathname.startsWith("/matricula") ||
    pathname.startsWith("/responsavel") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/logo.jpg" ||
    pathname === "/sw.js" ||
    pathname === "/manifest.json"
  ) {
    return nextResponse()
  }

  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token || !(await verify(token))) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  return nextResponse()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
