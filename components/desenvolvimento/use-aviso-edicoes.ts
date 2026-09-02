"use client"

import { useEffect } from "react"

/** Aviso nativo quando disponível; não persiste textos nem intercepta rotas SPA. */
export function useAvisoEdicoes(edicoesPendentes: boolean) {
  useEffect(() => {
    if (!edicoesPendentes) return
    const avisarSaida = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = true
    }
    window.addEventListener("beforeunload", avisarSaida)
    return () => window.removeEventListener("beforeunload", avisarSaida)
  }, [edicoesPendentes])
}
