"use client"

import { ThemeProvider } from "@/components/theme"
import { usePathname } from "next/navigation"
import { OnboardingProvider } from "@/components/onboarding/onboarding-context"
import { OnboardingTour } from "@/components/onboarding/onboarding-tour"

// O tour é do painel administrativo — não deve aparecer em rotas públicas
// (formulário de pré-matrícula, login, portal do responsável e a landing pública (`/`)).
const PUBLIC_PREFIXES = ["/login", "/matricula", "/responsavel"]

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublic = pathname === "/" || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
  return (
    <ThemeProvider>
      <OnboardingProvider totalSteps={8}>
        {children}
        {!isPublic && <OnboardingTour />}
      </OnboardingProvider>
    </ThemeProvider>
  )
}
