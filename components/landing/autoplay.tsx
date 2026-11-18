"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { Pause, Play } from "lucide-react"

const CONSULTA_MOVIMENTO = "(prefers-reduced-motion: reduce)"

function assinarMovimentoReduzido(aoMudar: () => void) {
  const consulta = window.matchMedia(CONSULTA_MOVIMENTO)
  consulta.addEventListener("change", aoMudar)
  return () => consulta.removeEventListener("change", aoMudar)
}

function movimentoReduzidoAgora() {
  return window.matchMedia(CONSULTA_MOVIMENTO).matches
}

/**
 * Autoplay dos carrosséis da landing (WCAG 2.2.2): quem não quer a rotação
 * automática tem um botão Pausar/Retomar, e quem pede menos movimento no
 * sistema (prefers-reduced-motion) nem recebe a rotação.
 *
 * `ativo` é a pausa temporária (mouse ou foco sobre o carrossel); a pausa pelo
 * botão é a escolha da pessoa e vale até ela retomar.
 */
export function useAutoplay({
  ativo,
  intervaloMs,
  avancar,
}: {
  ativo: boolean
  intervaloMs: number
  avancar: () => void
}) {
  const [pausadoPeloUsuario, setPausadoPeloUsuario] = useState(false)
  const avancarRef = useRef(avancar)
  const movimentoReduzido = useSyncExternalStore(assinarMovimentoReduzido, movimentoReduzidoAgora, () => false)

  useEffect(() => {
    avancarRef.current = avancar
  })

  const rodando = ativo && !pausadoPeloUsuario && !movimentoReduzido

  useEffect(() => {
    if (!rodando) return
    const t = setInterval(() => avancarRef.current(), intervaloMs)
    return () => clearInterval(t)
  }, [rodando, intervaloMs])

  return {
    pausadoPeloUsuario,
    movimentoReduzido,
    alternarPausa: () => setPausadoPeloUsuario((p) => !p),
  }
}

/** Botão Pausar/Retomar; não aparece quando o movimento já está reduzido pelo sistema. */
export function BotaoPausar({
  pausado,
  onAlternar,
  oculto = false,
  rotulo = "a rotação automática",
}: {
  pausado: boolean
  onAlternar: () => void
  oculto?: boolean
  rotulo?: string
}) {
  if (oculto) return null
  return (
    <button
      type="button"
      className="autoplay-btn"
      onClick={onAlternar}
      aria-label={pausado ? `Retomar ${rotulo}` : `Pausar ${rotulo}`}
    >
      {pausado ? <Play size={14} strokeWidth={2.5} aria-hidden /> : <Pause size={14} strokeWidth={2.5} aria-hidden />}
      <span>{pausado ? "Retomar" : "Pausar"}</span>
    </button>
  )
}
