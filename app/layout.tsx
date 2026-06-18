import type { Metadata, Viewport } from "next"
import { Inter, Nunito } from "next/font/google"
import { headers } from "next/headers"
import "./globals.css"
import { Toaster } from "sonner"
import { Providers } from "@/components/providers"
import { PWARegister } from "@/components/pwa-register"
import { getSession } from "@/lib/session"
import { AdminShell } from "@/components/layout/admin-shell"
import { db } from "@/lib/db"

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
    images: [{ url: "/logo.png", width: 500, height: 500, alt: "E.C. Itaquerense" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Escolinha Itaquerense",
    description: "Escolinha de futebol E.C. Itaquerense — formando atletas e cidadãos.",
    images: ["/logo.png"],
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
  const showAdminShell = session.authenticated && !pathname.startsWith("/responsavel") && !pathname.startsWith("/matricula") && pathname !== "/login" && pathname !== "/"
  const pendingEscalacoes = showAdminShell
    ? await db.chatSession.count({ where: { bloqueado: true } })
    : 0

  return (
      <html lang="pt-BR" className={`h-full antialiased ${inter.variable} ${nunito.variable}`} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="E.C. Itaquerense" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Escolinha Itaquerense" />
        <link rel="apple-touch-icon" href="/logo.png" sizes="500x500" />
      </head>
      <body className="flex h-full bg-background font-sans">
        {/* JSON-LD (dados estruturados) — no body, conforme guia do Next; `<` escapado p/ evitar XSS */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SportsActivityLocation",
              name: "E.C. Itaquerense — Escolinha de Futebol",
              description: "Escolinha de futebol formando atletas e cidadãos.",
              image: "/logo.png",
              url: baseUrl,
              sport: "Futebol",
              address: {
                "@type": "PostalAddress",
                addressLocality: "São Paulo",
                addressRegion: "SP",
                addressCountry: "BR",
              },
            }).replace(/</g, "\\u003c"),
          }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-lg focus:bg-brand-800 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none"
        >
          Pular para o conteúdo
        </a>
        <PWARegister />
        <Providers>
          {showAdminShell ? (
            <AdminShell role={(session.role ?? "admin") as "admin" | "secretaria" | "tecnico"} pendingEscalacoes={pendingEscalacoes}>
              {children}
            </AdminShell>
          ) : (
            <div id="main-content" className="flex flex-1 flex-col">
              {children}
            </div>
          )}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  )
}
