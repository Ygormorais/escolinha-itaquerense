import type { Metadata } from "next"
import { headers } from "next/headers"
import "./globals.css"
import { Sidebar } from "@/components/layout/sidebar"
import { Toaster } from "sonner"
import { Providers } from "@/components/providers"
import { getSession } from "@/lib/session"
import { db } from "@/lib/db"

export const metadata: Metadata = {
  title: "Escolinha Itaquerense",
  description: "Painel administrativo da Escolinha Itaquerense",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = (await headers()).get("x-pathname") ?? "/"
  const session = await getSession()
  const showAdminShell = session.authenticated && !pathname.startsWith("/responsavel") && pathname !== "/login"

  const pendingEscalacoes = showAdminShell
    ? await db.chatSession.count({ where: { bloqueado: true } })
    : 0

  return (
    <html lang="pt-BR" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex h-full bg-background">
        <Providers>
          {showAdminShell ? (
            <>
              <Sidebar pendingEscalacoes={pendingEscalacoes} />
              <main className="flex flex-1 flex-col overflow-auto">
                {children}
              </main>
            </>
          ) : (
            <div className="flex flex-1 flex-col">
              {children}
            </div>
          )}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  )
}
