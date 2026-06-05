"use client"
import { useEffect, useState } from "react"
import Image from "next/image"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { CategoriaJogos } from "@/lib/landing/jogos"
import { proximoFoco, type Foco } from "./jogos-carrossel-logic"

const INTERVALO_MS = 4000

export function JogosCarrossel({ categorias }: { categorias: CategoriaJogos[] }) {
  const [foco, setFoco] = useState<Foco>({ aba: 0, card: 0 })
  const [pausado, setPausado] = useState(false)

  const tamanhos = categorias.map((c) => c.jogos.length)

  useEffect(() => {
    if (pausado || categorias.length === 0) return
    const t = setInterval(() => setFoco((f) => proximoFoco(f, tamanhos)), INTERVALO_MS)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pausado, categorias.length, JSON.stringify(tamanhos)])

  if (categorias.length === 0) {
    return (
      <div className="jc">
        <div className="container">
          <h2 className="section-title">Jogos &amp; Resultados</h2>
          <div className="jc-empty">
            <Image className="jc-badge" src="/logo.png" alt="E.C. Itaquerense" width={48} height={48} />
            <p>Os jogos e resultados do campeonato aparecerão aqui em breve. Fique ligado!</p>
          </div>
        </div>
      </div>
    )
  }

  const abaSegura = Math.min(foco.aba, categorias.length - 1)
  const ativa = categorias[abaSegura]
  const cardSeguro = Math.min(foco.card, Math.max(0, ativa.jogos.length - 1))

  return (
    <div
      className="jc"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      <div className="container">
        <div className="jc-tabs">
          {categorias.map((c, i) => (
            <button
              key={c.categoria}
              className={"jc-tab" + (i === abaSegura ? " active" : "")}
              onClick={() => setFoco({ aba: i, card: 0 })}
            >
              {c.categoria}
            </button>
          ))}
        </div>

        <div className="jc-track">
          {ativa.jogos.map((j, i) => (
            <div key={i} className={"jc-card" + (i === cardSeguro ? " focus" : "")}>
              <div className="jc-comp">
                {ativa.categoria} · {j.local === "Casa" ? "🏠 Casa" : j.local === "Fora" ? "✈️ Fora" : "⚖️ Neutro"}
              </div>
              <div className="jc-match">
                <Image className="jc-badge" src="/logo.png" alt="E.C. Itaquerense" width={34} height={34} />
                <span className="jc-score">{j.realizado ? j.placar : "VS"}</span>
                <span className="jc-adv">{j.adversario}</span>
              </div>
              <div className="jc-foot">
                <span>{format(new Date(j.data), "dd/MM/yyyy", { locale: ptBR })}</span>
                {j.sumulaUrl && (
                  <a href={j.sumulaUrl} target="_blank" rel="noopener noreferrer" className="jc-sumula">
                    Ver súmula
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
