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
    // Deferido para um effect porque localStorage não existe no SSR; o estado
    // inicial precisa ser o mesmo no servidor e na hidratação (active=false,
    // isCompleted=true) e só então é ajustado no cliente.
    /* eslint-disable react-hooks/set-state-in-effect */
    const done = localStorage.getItem(STORAGE_KEY)
    if (!done) {
      setActive(true)
      setIsCompleted(false)
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  const next = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, totalSteps - 1))
  }, [totalSteps])

  const prev = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0))
  }, [])

  const skip = useCallback(() => {
    // Pular também persiste: sem isso o tour reaparecia em todo reload
    localStorage.setItem(STORAGE_KEY, "true")
    setIsCompleted(true)
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
