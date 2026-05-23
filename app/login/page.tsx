import { LoginForm } from "./login-form"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const session = await getSession()
  if (session.authenticated) redirect("/")

  const { next } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAF8] dark:bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          {/* Logo / marca */}
          <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-800 text-white shadow-lg">
            <svg viewBox="0 0 24 24" className="size-9 fill-current" aria-hidden>
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 2 C7 5 5 10 12 12 C19 14 17 19 12 22" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <path d="M2 12 C5 7 10 5 12 12 C14 19 19 17 22 12" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold font-heading text-foreground">Escolinha Itaquerense</h1>
            <p className="text-sm text-muted-foreground mt-1">Painel Administrativo</p>
          </div>
        </div>

        <LoginForm next={next} />
      </div>
    </div>
  )
}
