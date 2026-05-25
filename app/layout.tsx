import type { Metadata } from "next"
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
  const session = await getSession()

  const pendingEscalacoes = session.authenticated
    ? await db.chatSession.count({ where: { bloqueado: true } })
    : 0

  return (
    <html lang="pt-BR" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex h-full bg-background">
        <Providers>
          {session.authenticated ? (
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
