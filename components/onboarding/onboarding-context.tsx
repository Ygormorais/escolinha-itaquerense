"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"

interface OnboardingContextType {
  active: boolean
  currentStep: number
  totalSteps: number
  next: () => void
  prev: () => void
  skip: () => void
  complete: () => void
  isCompleted: boolean
}

const OnboardingContext = createContext<OnboardingContextType | null>(null)

const STORAGE_KEY = "escolinha_onboarding_v1"

export function OnboardingProvider({
  children,
  totalSteps = 8,
}: {
  children: ReactNode
  totalSteps?: number
}) {
  const [active, setActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isCompleted, setIsCompleted] = useState(true)

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY)
    if (!done) {
      setActive(true)
      setIsCompleted(false)
    }
  }, [])

  const next = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, totalSteps - 1))
  }, [totalSteps])

  const prev = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0))
  }, [])

  const skip = useCallback(() => {
    setActive(false)
  }, [])

  const complete = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true")
    setIsCompleted(true)
    setActive(false)
  }, [])

  return (
    <OnboardingContext.Provider value={{ active, currentStep, totalSteps, next, prev, skip, complete, isCompleted }}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider")
  return ctx
}
