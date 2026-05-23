import type { Metadata } from "next"
import "./globals.css"
import { Sidebar } from "@/components/layout/sidebar"
import { Toaster } from "sonner"
import { Providers } from "@/components/providers"
import { getSession } from "@/lib/session"

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

  return (
    <html lang="pt-BR" className="h-full antialiased" suppressHydrationWarning>
      <body className={`flex h-full ${session.authenticated ? "bg-background" : "bg-background"}`}>
        <Providers>
          {session.authenticated ? (
            <>
              <Sidebar />
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
