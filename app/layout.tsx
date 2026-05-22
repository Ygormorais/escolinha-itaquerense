import type { Metadata } from "next"
import "./globals.css"
import { Sidebar } from "@/components/layout/sidebar"

export const metadata: Metadata = {
  title: "Escolinha Itaquerense",
  description: "Painel administrativo da Escolinha Itaquerense",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="flex h-full bg-[#FAFAF8]">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-auto">
          {children}
        </main>
      </body>
    </html>
  )
}
