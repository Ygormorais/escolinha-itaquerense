"use client"

import { HelpCircle } from "lucide-react"
import { useOnboarding } from "./onboarding-context"

export function OnboardingRestart() {
  const { isCompleted, active } = useOnboarding()

  // Hide if tour is already active or not completed
  if (active || !isCompleted) return null

  function handleRestart() {
    localStorage.removeItem("escolinha_onboarding_v1")
    window.location.reload()
  }

  return (
    <button
      onClick={handleRestart}
      className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label="Ajuda / Tour"
    >
      <HelpCircle className="size-4" />
    </button>
  )
}
