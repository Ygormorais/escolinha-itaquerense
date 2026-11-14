"use client"

import { useEffect } from "react"

/** Abre a janela de impressão uma vez, logo após a emissão. */
export function AutoImprimir() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 300)
    return () => clearTimeout(t)
  }, [])
  return null
}
