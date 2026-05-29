import type { Metadata, Viewport } from "next"
import { Inter, Nunito } from "next/font/google"
import { headers } from "next/headers"
import "./globals.css"
import { Toaster } from "sonner"
import { Providers } from "@/components/providers"
import { getSession } from "@/lib/session"
import { db } from "@/lib/db"
import { AdminShell } from "@/components/layout/admin-shell"

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
})

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-nunito",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0f" },
  ],
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Escolinha Itaquerense",
    template: "%s — Escolinha Itaquerense",
  },
  description: "Escolinha de futebol E.C. Itaquerense — formando atletas e cidadãos. Painel administrativo para gestão de alunos, pagamentos, frequência e campeonatos.",
  applicationName: "Escolinha Itaquerense",
  authors: [{ name: "E.C. Itaquerense" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Escolinha Itaquerense",
    title: "Escolinha Itaquerense",
    description: "Escolinha de futebol E.C. Itaquerense — formando atletas e cidadãos.",
    images: [{ url: "/logo.jpg", width: 500, height: 500, alt: "E.C. Itaquerense" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Escolinha Itaquerense",
    description: "Escolinha de futebol E.C. Itaquerense — formando atletas e cidadãos.",
    images: ["/logo.jpg"],
  },
  robots: {
    index: false,
    follow: false,
  },
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
    <html lang="pt-BR" className={`h-full antialiased ${inter.variable} ${nunito.variable}`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SportsActivityLocation",
              name: "E.C. Itaquerense — Escolinha de Futebol",
              description: "Escolinha de futebol formando atletas e cidadãos.",
              image: "/logo.jpg",
              url: baseUrl,
              sport: "Futebol",
              address: {
                "@type": "PostalAddress",
                addressLocality: "São Paulo",
                addressRegion: "SP",
                addressCountry: "BR",
              },
            }),
          }}
        />
      </head>
      <body className="flex h-full bg-background font-sans">
        <Providers>
          {showAdminShell ? (
            <AdminShell pendingEscalacoes={pendingEscalacoes}>
              {children}
            </AdminShell>
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
