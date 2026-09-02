import { redirect } from "next/navigation"
import { isSafeInternalPath } from "@/lib/auth-destination"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { ResponsavelLoginClient } from "./responsavel-login-client"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Portal da Família — Elite Itaquerense",
  robots: { index: false, follow: false },
}

export default async function ResponsavelLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; trocar?: string }>
}) {
  const session = await getResponsavelSession()
  const { next, trocar } = await searchParams
  const nextPathname = next?.split(/[?#]/, 1)[0]
  const destination = isSafeInternalPath(next)
    && next.startsWith("/responsavel")
    && nextPathname !== "/responsavel/login"
    && nextPathname !== "/responsavel/recuperar-senha"
    && nextPathname !== "/responsavel/redefinir-senha"
    ? next
    : "/responsavel"

  if (session.authenticated && trocar !== "1") {
    redirect(destination)
  }

  return <ResponsavelLoginClient destination={destination} />
}
