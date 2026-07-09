import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSessionSecret } from "@/lib/env"
import { SESSION_COOKIE, SESSION_PREFIX } from "@/lib/session-constants"

const COOKIE_NAME = SESSION_COOKIE

async function verifyHmac(signed: string, prefix: string): Promise<boolean> {
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

  return value.startsWith(prefix)
}

const verify = (signed: string) => verifyHmac(signed, SESSION_PREFIX)
const verifyResponsavel = (signed: string) => verifyHmac(signed, "resp:")

/** Rotas que NÃO exigem sessão de admin: ou são públicas, ou são autenticadas
 * pelo PRÓPRIO handler (webhooks por assinatura, cron/sync por Bearer/token).
 * Estas precisam passar pelo proxy — senão ficam inalcançáveis pelos chamadores
 * externos (MercadoPago, scheduler de cron, FPFS), que não têm cookie de sessão. */
/** Retorna true se o pathname começa com prefix seguido de "/" ou "?" ou é exatamente igual. */
function hasPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix ||
    pathname.startsWith(prefix + "/") ||
    pathname.startsWith(prefix + "?")
}

/** Rotas que NÃO exigem sessão de admin: ou são públicas, ou são autenticadas
 * pelo PRÓPRIO handler (webhooks por assinatura, cron/sync por Bearer/token).
 * Estas precisam passar pelo proxy — senão ficam inalcançáveis pelos chamadores
 * externos (MercadoPago, scheduler de cron, FPFS), que não têm cookie de sessão. */
export function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/api/health" ||
    hasPrefix(pathname, "/api/auth") ||
    hasPrefix(pathname, "/api/responsavel") ||
    pathname.startsWith("/api/push/") ||
    pathname.startsWith("/api/whatsapp/") ||   // webhook + reativar (auth própria)
    pathname.startsWith("/api/webhooks/") ||   // mercadopago (assinatura HMAC)
    pathname.startsWith("/api/cron/") ||       // lembretes/fpfs (Bearer secret)
    pathname.startsWith("/api/sync/") ||       // fpfs (x-fpfs-token)
    hasPrefix(pathname, "/api/config/public") ||
    hasPrefix(pathname, "/api/escudo") || // escudos FPFS na landing (proxy anti-hotlink)
    hasPrefix(pathname, "/api/upload/matricula") ||
    pathname.startsWith("/uploads/fotos/") ||
    hasPrefix(pathname, "/matricula") ||
    pathname.startsWith("/qr/") ||
    hasPrefix(pathname, "/checkin") ||
    pathname.startsWith("/api/checkin") ||
    hasPrefix(pathname, "/frequencia/scanner") ||
    hasPrefix(pathname, "/frequencia/qrcode") ||
    hasPrefix(pathname, "/resultados") ||
    hasPrefix(pathname, "/horarios") ||
    hasPrefix(pathname, "/noticias/publico") ||
    hasPrefix(pathname, "/responsavel/login") ||
    hasPrefix(pathname, "/responsavel/recuperar-senha") ||
    hasPrefix(pathname, "/responsavel/redefinir-senha") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/landing/") || // fotos/história da landing pública
    pathname === "/logo.png" ||
    pathname === "/logo.jpg" ||
    pathname === "/sw.js" ||
    pathname === "/manifest.json"
  )
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

  // Portal do responsável: auth própria (cookie "responsavel_session"), sem relação
  // com a sessão de admin. Verificamos aqui para evitar flash do layout protegido.
  if (pathname.startsWith("/responsavel")) {
    const isAuthPage =
      pathname.startsWith("/responsavel/login") ||
      pathname.startsWith("/responsavel/recuperar-senha") ||
      pathname.startsWith("/responsavel/redefinir-senha")

    if (!isAuthPage) {
      const token = request.cookies.get("responsavel_session")?.value
      if (!token || !(await verifyResponsavel(token))) {
        const url = request.nextUrl.clone()
        url.pathname = "/responsavel/login"
        url.search = ""
        return NextResponse.redirect(url)
      }
    }

    return nextResponse()
  }

  // /login é sempre acessível (público). Não redirecionar sessão ativa aqui —
  // a página de login decide se mostra o formulário ou a sessão existente
  // (com opção de sair). Pular o formulário silenciosamente era confuso e
  // escondia o gate de autenticação.
  if (pathname === "/login") {
    return nextResponse()
  }

  if (isPublicPath(pathname)) {
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
