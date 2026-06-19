"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"

type Theme = "light" | "dark"

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({ theme: "light", setTheme: () => {} })

const STORAGE_KEY = "theme"

/**
 * Provider de tema mínimo (claro/escuro via classe `.dark`), sem renderizar
 * nenhuma tag <script> no cliente — o anti-flash fica num script server-rendered
 * no <head> (ver app/layout.tsx). Substitui next-themes, que emitia o aviso
 * "script tag while rendering" do React 19.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Estado inicial "light" igual no SSR e na 1ª hidratação; ajustado no effect.
  const [theme, setThemeState] = useState<Theme>("light")

  useEffect(() => {
    let stored: string | null = null
    try {
      stored = localStorage.getItem(STORAGE_KEY)
    } catch {}
    const inicial: Theme =
      stored === "dark" || stored === "light"
        ? stored
        : document.documentElement.classList.contains("dark")
          ? "dark"
          : "light"
    // Sincronização pós-hidratação obrigatória: SSR e a 1ª render no cliente
    // precisam ser "light" (senão dá mismatch de hidratação); só depois do mount
    // podemos ler localStorage/DOM e ajustar. É o uso legítimo de setState em effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(inicial)
  }, [])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    const el = document.documentElement
    el.classList.toggle("dark", t === "dark")
    el.style.colorScheme = t
    try {
      localStorage.setItem(STORAGE_KEY, t)
    } catch {}
  }, [])

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
