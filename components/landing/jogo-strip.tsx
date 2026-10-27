import Image from "next/image"
import { ChevronRight } from "lucide-react"
import type { FaixaPartida } from "@/lib/landing/hero"

/** Faixa logo abaixo do cabeçalho: próxima partida ou último resultado do clube. */
export function JogoStrip({ faixa }: { faixa: FaixaPartida }) {
  return (
    <div className="strip" role="region" aria-label={faixa.rotulo}>
      <div className="container strip-row">
        <div className="strip-tag">
          <strong>{faixa.rotulo}</strong>
          <span>{faixa.campeonato}</span>
        </div>

        <div className="strip-match">
          <Image src="/logo.png" alt="" width={56} height={56} aria-hidden />
          <span>Itaquerense</span>
          {faixa.placar ? (
            <span className="strip-score" data-numeric>{faixa.placar}</span>
          ) : (
            <span className="strip-vs" aria-label="contra">×</span>
          )}
          <span>{faixa.adversario}</span>
        </div>

        <div className="strip-when">
          <span data-numeric>{faixa.quando}</span>
          <span>{faixa.local}</span>
        </div>

        <a
          href={faixa.href}
          className="strip-cta"
          {...(faixa.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {faixa.ctaLabel}
          <ChevronRight size={16} strokeWidth={2.5} aria-hidden />
        </a>
      </div>
    </div>
  )
}
