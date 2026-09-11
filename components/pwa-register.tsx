"use client"

import { useEffect } from "react"

export function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      try {
        navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {})
      } catch {
        // registro pode falhar de forma síncrona em contextos restritos (ex.: iframe sandboxado)
      }
    }
  }, [])
  return null
}
