"use client"

import { ThemeProvider } from "@/components/theme"
import { usePathname } from "next/navigation"
import { OnboardingProvider } from "@/components/onboarding/onboarding-context"
import { OnboardingTour } from "@/components/onboarding/onboarding-tour"
import { isPublicRoute } from "@/lib/public-routes"

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublic = isPublicRoute(pathname)
  return (
    <ThemeProvider>
      <OnboardingProvider totalSteps={8}>
        {children}
        {!isPublic && <OnboardingTour />}
      </OnboardingProvider>
    </ThemeProvider>
  )
}
