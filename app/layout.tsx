import type { Metadata, Viewport } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import Script from "next/script"

import "./globals.css"
import { Toaster } from "sonner"
import { Providers } from "@/components/providers"
import { PWARegister } from "@/components/pwa-register"
import { getSession } from "@/lib/session"
import { ShellGate } from "@/components/layout/shell-gate"
import { db } from "@/lib/db"

/** Canônico: Inter (corpo) + Playfair (títulos) — site, admin e portal. */
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-playfair",
  display: "swap",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF8F5" },
    { media: "(prefers-color-scheme: dark)", color: "#1C1412" },
  ],
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

const jsonLd = {
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
}

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
  const session = await getSession()
  // A decisão de mostrar o shell do admin é feita no cliente (ShellGate), porque
  // o root layout não re-renderiza em navegação client-side.
  const [pendingEscalacoes, pendingMatriculas, pendingSolicitacoes] = session.authenticated
    ? await Promise.all([
        db.chatSession.count({ where: { bloqueado: true } }),
        db.preMatricula.count({ where: { status: "pendente" } }),
        db.solicitacao.count({ where: { status: "pendente" } }),
      ])
    : [0, 0, 0]

  return (
      <html lang="pt-BR" className={`h-full antialiased ${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        <Script id="theme-preload" strategy="beforeInteractive">
          {"try{if(localStorage.getItem('theme')==='dark'){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark'}}catch(e){ }"}
        </Script>
        <Script id="site-jsonld" type="application/ld+json" strategy="beforeInteractive">
          {JSON.stringify(jsonLd).replace(/</g, "\\u003c")}
        </Script>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="E.C. Itaquerense" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Escolinha Itaquerense" />
        <link rel="apple-touch-icon" href="/logo.png" sizes="500x500" />
      </head>
      <body className="flex h-full bg-background font-body antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-lg focus:bg-brand-800 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none"
        >
          Pular para o conteúdo
        </a>
        <PWARegister />
        <Providers>
          <ShellGate
            authenticated={session.authenticated}
            role={(session.role ?? "admin") as "admin" | "secretaria" | "tecnico"}
            pendingEscalacoes={pendingEscalacoes}
            pendingMatriculas={pendingMatriculas}
            pendingSolicitacoes={pendingSolicitacoes}
          >
            {children}
          </ShellGate>
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  )
}
