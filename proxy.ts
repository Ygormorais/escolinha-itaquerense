import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const COOKIE_NAME = "escolinha_session"

async function verify(signed: string): Promise<boolean> {
  const secret = process.env.SESSION_SECRET ?? "dev-secret"
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

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/whatsapp/webhook") ||
    pathname.startsWith("/responsavel") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/logo.jpg"
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token || !(await verify(token))) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
