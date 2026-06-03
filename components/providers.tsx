"use client"

import { ThemeProvider } from "next-themes"
import { OnboardingProvider } from "@/components/onboarding/onboarding-context"
import { OnboardingTour } from "@/components/onboarding/onboarding-tour"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
      <OnboardingProvider totalSteps={8}>
        {children}
        <OnboardingTour />
      </OnboardingProvider>
    </ThemeProvider>
  )
}
