"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { viaProxyEscudoCliente } from "./escudo-src"

function iniciais(nome: string): string {
  const partes = nome.replace(/[^\p{L}\s]/gu, " ").split(/\s+/).filter(Boolean)
  return (partes.length > 1 ? partes[0][0] + partes[1][0] : (partes[0] ?? "?").slice(0, 2)).toUpperCase()
}

/**
 * Escudo de um time da partida. O Itaquerense usa o logo local; o adversário tenta
 * cada URL candidata e cai no monograma se todas falharem.
 */
export function EscudoTime({ nome, nosso, urls, tamanho = 32 }: { nome: string; nosso: boolean; urls: string[]; tamanho?: number }) {
  const [idx, setIdx] = useState(0)
  const imgRef = useRef<HTMLImageElement>(null)
  const atual = urls[idx]

  // Se a imagem falhou antes da hidratação, o onError não dispara: confere no mount.
  useEffect(() => {
    const img = imgRef.current
    if (img && img.complete && img.naturalWidth === 0) setIdx((i) => i + 1)
  }, [idx])

  if (nosso) {
    return <Image className="escudo-time" src="/logo.png" alt="" width={tamanho} height={tamanho} />
  }
  if (!atual) {
    return (
      <span className="escudo-time escudo-mono" style={{ width: tamanho, height: tamanho }} aria-hidden>
        {iniciais(nome)}
      </span>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      key={atual}
      className="escudo-time"
      src={viaProxyEscudoCliente(atual)}
      alt=""
      width={tamanho}
      height={tamanho}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setIdx((i) => i + 1)}
    />
  )
}
