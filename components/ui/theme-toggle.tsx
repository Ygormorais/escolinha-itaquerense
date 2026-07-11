"use client"

import { useTheme } from "@/components/theme"
import { cn } from "@/lib/utils"
import { Moon, Sun } from "lucide-react"
import { useSyncExternalStore } from "react"

const emptySubscribe = () => () => {}

export function ThemeToggle({ className }: { className?: string } = {}) {
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)
  if (!mounted) {
    return <div className={cn("size-8 shrink-0", className)} aria-hidden />
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className,
      )}
      title={theme === "dark" ? "Modo claro" : "Modo escuro"}
      aria-label={theme === "dark" ? "Modo claro" : "Modo escuro"}
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  )
}
