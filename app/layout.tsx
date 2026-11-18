import type { Metadata, Viewport } from "next"
import { Raleway } from "next/font/google"

import "./globals.css"
import { Toaster } from "sonner"
import { Providers } from "@/components/providers"
import { PWARegister } from "@/components/pwa-register"
import { getSession } from "@/lib/session"
import { ShellGate } from "@/components/layout/shell-gate"
import { SkipLink } from "@/components/layout/skip-link"
import { ThemeScript } from "@/components/theme-script"
import { db } from "@/lib/db"

/** Canônico: Raleway (variável, 100–900) em todo o sistema — site, admin e portal. */
const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
  display: "swap",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0B0B" },
  ],
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Escolinha Itaquerense",
    template: "%s — Escolinha Itaquerense",
  },
  description: "Escolinha de futebol E.C. Itaquerense — formando atletas e cidadãos. Turmas, horários e pré-matrícula online.",
  applicationName: "Escolinha Itaquerense",
  authors: [{ name: "E.C. Itaquerense" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Escolinha Itaquerense",
    title: "Escolinha Itaquerense",
    description: "Escolinha de futebol E.C. Itaquerense — formando atletas e cidadãos.",
    // A imagem 1200x630 vem de app/opengraph-image.tsx (o Next injeta as tags).
  },
  twitter: {
    card: "summary_large_image",
    title: "Escolinha Itaquerense",
    description: "Escolinha de futebol E.C. Itaquerense — formando atletas e cidadãos.",
  },
  // Padrão fechado: áreas autenticadas não são indexadas; as páginas públicas
  // (landing, matrícula, horários, notícias, partidas) abrem com robots próprio.
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
  const [pendingEscalacoes, pendingMatriculas, pendingSolicitacoes, pendingAtraso] = session.authenticated
    ? await Promise.all([
        db.chatSession.count({ where: { bloqueado: true } }),
        db.preMatricula.count({ where: { status: "pendente" } }),
        db.solicitacao.count({ where: { status: "pendente" } }),
        // Alunos com mensalidade vencida e não paga — mesma regra da tela de Inadimplência.
        session.role === "tecnico"
          ? Promise.resolve(0)
          : db.pagamento
              .findMany({
                where: { dataPagamento: null, dataVencimento: { lt: new Date() }, aluno: { status: "Ativo" } },
                select: { alunoId: true },
                distinct: ["alunoId"],
              })
              .then((linhas) => linhas.length),
      ])
    : [0, 0, 0, 0]

  return (
      <html lang="pt-BR" className={`h-full antialiased ${raleway.variable}`} suppressHydrationWarning>
      <head>
        <ThemeScript />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="E.C. Itaquerense" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Escolinha Itaquerense" />
        <link rel="apple-touch-icon" href="/logo.png" sizes="512x512" />
      </head>
      <body className="flex h-full bg-background font-body antialiased">
        <SkipLink />
        <PWARegister />
        <Providers>
          <ShellGate
            authenticated={session.authenticated}
            role={(session.role ?? "admin") as "admin" | "secretaria" | "tecnico"}
            pendingEscalacoes={pendingEscalacoes}
            pendingMatriculas={pendingMatriculas}
            pendingSolicitacoes={pendingSolicitacoes}
            pendingAtraso={pendingAtraso}
          >
            {children}
          </ShellGate>
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  )
}
