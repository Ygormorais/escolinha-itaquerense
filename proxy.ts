import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSessionSecret } from "@/lib/env"
import { SESSION_COOKIE, SESSION_PREFIX, SESSION_MAX_AGE_SECONDS } from "@/lib/session-constants"
import { canAccessStaffPath, isStaffRole } from "@/lib/permissions"
import { isPrivateAppPath } from "@/lib/public-routes"

const COOKIE_NAME = SESSION_COOKIE

async function verifyHmac(signed: string, prefix: string): Promise<string | null> {
  const secret = getSessionSecret()
  const lastDot = signed.lastIndexOf(".")
  if (lastDot === -1) return null

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

  if (expectedHex.length !== providedHex.length) return null

  // timing-safe comparison
  let diff = 0
  for (let i = 0; i < expectedHex.length; i++) {
    diff |= expectedHex.charCodeAt(i) ^ providedHex.charCodeAt(i)
  }
  if (diff !== 0) return null

  return value.startsWith(prefix) ? value : null
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
    hasPrefix(pathname, "/api/calendario") || // feed .ics: autorizado pelo token longo na própria URL
    pathname.startsWith("/api/push/") ||
    pathname.startsWith("/api/whatsapp/") ||   // webhook + reativar (auth própria)
    pathname.startsWith("/api/webhooks/") ||   // mercadopago (assinatura HMAC)
    pathname.startsWith("/api/cron/") ||       // lembretes/fpfs (Bearer secret)
    pathname.startsWith("/api/sync/") ||       // fpfs (x-fpfs-token)
    hasPrefix(pathname, "/api/config/public") ||
    hasPrefix(pathname, "/api/escudo") || // escudos FPFS na landing (proxy anti-hotlink)
    pathname === "/api/csp-report" || // relatórios CSP enviados pelo navegador (sem cookie)
    hasPrefix(pathname, "/api/anuncio") || // clique em banner de publicidade (conta e redireciona)
    hasPrefix(pathname, "/api/upload/matricula") ||
    pathname.startsWith("/uploads/fotos/") ||
    pathname.startsWith("/uploads/midia/") ||
    pathname.startsWith("/uploads/publicidade/") || // banners públicos
    hasPrefix(pathname, "/matricula") ||
    hasPrefix(pathname, "/aula-experimental") || // agendamento público + .ics da aula (sem dados pessoais)
    pathname.startsWith("/qr/") ||
    hasPrefix(pathname, "/checkin") ||
    pathname.startsWith("/api/checkin") ||
    hasPrefix(pathname, "/resultados") ||
    hasPrefix(pathname, "/partidas") ||
    pathname === "/termos" ||          // termos e política de privacidade: linkados no rodapé e no aceite da pré-matrícula
    pathname === "/privacidade" ||
    hasPrefix(pathname, "/horarios") ||
    hasPrefix(pathname, "/noticias/publico") ||
    pathname === "/buscar" ||            // busca do site público (notícias publicadas e partidas)
    hasPrefix(pathname, "/responsavel/login") ||
    hasPrefix(pathname, "/responsavel/recuperar-senha") ||
    hasPrefix(pathname, "/responsavel/redefinir-senha") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/landing/") || // fotos/história da landing pública
    pathname === "/logo.png" ||
    pathname === "/logo.jpg" ||
    pathname === "/sw.js" ||
    pathname === "/manifest.json" ||
    pathname === "/opengraph-image" || // prévia 1200x630 (WhatsApp/redes) gerada por app/opengraph-image.tsx
    pathname === "/twitter-image" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    hasPrefix(pathname, "/validar-recibo") // QR do recibo: conferência por terceiros
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
        url.searchParams.set("next", pathname)
        return NextResponse.redirect(url)
      }
    }

    return nextResponse()
  }

  // A página resolve sessões ativas no servidor e mantém `?trocar=1` como
  // entrada explícita para troca de conta.
  if (pathname === "/login") {
    return nextResponse()
  }

  if (isPublicPath(pathname)) {
    return nextResponse()
  }

  // Caminho que não é público nem de uma área privada conhecida não existe:
  // segue para o Next responder 404 (página "não encontrada"), em vez de
  // mandar quem digitou um link errado para a tela de login da equipe.
  if (!isPrivateAppPath(pathname)) {
    return nextResponse()
  }

  const token = request.cookies.get(COOKIE_NAME)?.value
  const sessionValue = token ? await verify(token) : null
  if (!sessionValue) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  const [, role, , iatStr] = sessionValue.slice(SESSION_PREFIX.length).split(":")
  // Cookie expirado (ou do formato antigo, sem iat) volta ao login; getSession confere o resto.
  const iat = Number(iatStr)
  const agora = Math.floor(Date.now() / 1000)
  const expirado = !Number.isSafeInteger(iat) || agora - iat > SESSION_MAX_AGE_SECONDS
  if (expirado || !isStaffRole(role)) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.search = ""
    return NextResponse.redirect(url)
  }
  if (!canAccessStaffPath(pathname, role)) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    url.search = ""
    url.searchParams.set("erro", "acesso-negado")
    return NextResponse.redirect(url)
  }

  return nextResponse()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
