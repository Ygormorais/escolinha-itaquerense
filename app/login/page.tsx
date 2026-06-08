import { LoginForm } from "./login-form"
import { AuthShell } from "@/components/auth/auth-shell"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export const metadata = { title: "Entrar — Escolinha Itaquerense" }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const session = await getSession()
  if (session.authenticated) redirect("/dashboard")

  const { next } = await searchParams

  return (
    <AuthShell
      badge="Painel Administrativo"
      title="Gestão com mais clareza para a rotina da escolinha."
      description="Acesse o painel para acompanhar alunos, pagamentos, frequência e operações do dia a dia em um único fluxo."
      accentLabel="Ambiente"
      accentValue="Controle administrativo e acompanhamento operacional"
    >
      <LoginForm next={next} />
    </AuthShell>
  )
}
