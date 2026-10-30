import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { AcaoInicio } from "@/lib/inicio"

/** Lista curta do que pede ação hoje; cada linha leva à tela que resolve. */
export function PrecisaDeVoce({ acoes, total }: { acoes: AcaoInicio[]; total: number }) {
  return (
    <section data-slot="precisa-de-voce" aria-labelledby="precisa-de-voce-titulo" className="rounded-[var(--radius-card)] border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 id="precisa-de-voce-titulo" className="text-base font-extrabold">Precisa de você</h2>
        {total > acoes.length && (
          <Link href="/pendencias" className="text-sm font-semibold text-foreground underline-offset-4 hover:underline">
            Ver todas ({total})
          </Link>
        )}
      </div>
      {acoes.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Tudo em dia. Nada pendente agora.</p>
      ) : (
        <ul className="mt-2 divide-y divide-border">
          {acoes.map((acao) => (
            <li key={acao.texto}>
              <Link
                href={acao.href}
                className="flex items-center justify-between gap-3 py-2.5 text-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex min-w-0 items-center gap-2">
                  {acao.prioridade === "alta" && <span className="size-2 shrink-0 rounded-full bg-danger-600" aria-hidden />}
                  <span className="truncate first-letter:uppercase">{acao.texto}</span>
                  {acao.prioridade === "alta" && <span className="sr-only">(urgente)</span>}
                </span>
                <span className="flex shrink-0 items-center gap-1 font-semibold">
                  Abrir <ArrowRight className="size-3.5" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
