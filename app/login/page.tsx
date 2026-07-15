import Link from "next/link"
import { LoginForm } from "./login-form"
import { SessionGate } from "./session-gate"
import { AuthShell } from "@/components/auth/auth-shell"
import { getSession } from "@/lib/session"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Área da equipe — Elite Itaquerense",
  robots: { index: false, follow: false },
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const session = await getSession()
  const { next } = await searchParams

  // Destino pós-login seguro (só path interno)
  const nextSafe =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard"

  return (
    <AuthShell
      badge="Acesso restrito"
      title="Área da equipe administrativa."
      description="Ambiente interno para secretaria, técnicos e diretoria. Pais e responsáveis usam o portal da família — não este login."
      accentLabel="Quem acessa"
      accentValue="Somente equipe autorizada do clube"
      footer={
        <div className="space-y-2">
          <Link href="/responsavel" className="block font-medium text-brand-800 underline-offset-4 hover:underline">
            É responsável? Portal da família →
          </Link>
          <Link href="/" className="block text-xs text-muted-foreground underline-offset-4 hover:underline">
            Voltar ao site público
          </Link>
        </div>
      }
    >
      {session.authenticated ? (
        <SessionGate user={session.user} nextPath={nextSafe} />
      ) : (
        <LoginForm next={nextSafe} />
      )}
    </AuthShell>
  )
}
