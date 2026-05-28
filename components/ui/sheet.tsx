"use client"

import { useEffect } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  side?: "left" | "right"
}

export function Sheet({ open, onClose, children, side = "left" }: SheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
      return () => { document.body.style.overflow = "" }
    }
  }, [open])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    if (open) window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div
        className={cn(
          "fixed inset-y-0 z-50 flex w-72 flex-col bg-card shadow-xl transition-transform",
          side === "left" ? "left-0" : "right-0"
        )}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
        >
          <X className="size-4" />
        </button>
        {children}
      </div>
    </div>
  )
}
