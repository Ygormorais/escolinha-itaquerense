import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

interface PortalHeroStat {
  label: string
  value: string | number
}

interface PortalHeroProps {
  title: string
  description?: string
  backHref?: string
  backLabel?: string
  badge?: string
  icon?: LucideIcon
  stats?: PortalHeroStat[]
  children?: ReactNode
  className?: string
}

/** Fundo escuro com filete vermelho embaixo — vermelho só como destaque */
const FUNDO =
  "bg-[#0B0B0B] border-b-4 border-b-[var(--red,#C62828)]"

export function PortalHero({
  title,
  description,
  backHref,
  backLabel = "Voltar ao portal",
  badge,
  // icon fica na interface por compatibilidade; o título não mostra mais ícone.
  stats,
  children,
  className,
}: PortalHeroProps) {
  const hasStats = stats && stats.length > 0
  // O menu do portal já leva ao Início: o "Voltar" só aparece quando volta para outra tela.
  const mostrarVoltar = backHref != null && (backHref !== "/responsavel" || backLabel !== "Voltar ao portal")

  return (
    <section
      className={cn(
        "overflow-hidden rounded-[var(--radius-hero)] px-6 py-7 text-white sm:px-8 sm:py-8",
        FUNDO,
        className,
      )}
    >
      {/* Texto em cima e números numa linha só embaixo: sem bloco preto vazio no desktop
          e sem três cartões empilhados empurrando o conteúdo no celular. */}
      <div className="flex flex-col gap-6">
        <div className="space-y-4">
          {mostrarVoltar && (
            <Link
              href={backHref!}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 font-body text-sm font-semibold tracking-[0.02em] text-white/90 transition-colors hover:bg-white/16"
            >
              <ArrowLeft className="size-4" />
              {backLabel}
            </Link>
          )}
          {badge && !mostrarVoltar && (
            <div className="inline-flex rounded-full border border-white/30 bg-white/15 px-3.5 py-1.5 font-body text-[11px] font-bold uppercase tracking-[0.12em] text-white/95">
              {badge}
            </div>
          )}
          <div className="space-y-2">
            {/* Sem ícone no título: só algumas telas tinham, o que deixava os cabeçalhos desiguais. */}
            <h1 className="font-heading text-3xl font-extrabold tracking-[-0.02em] text-white sm:text-4xl">
              {title}
            </h1>
            {description && (
              <p className="max-w-2xl font-body text-sm leading-7 text-white/80 sm:text-[15px]">
                {description}
              </p>
            )}
          </div>
          {children}
        </div>

        {hasStats && (
          <dl className="grid grid-cols-3 gap-2 sm:gap-3 lg:max-w-3xl">
            {stats!.map((s) => (
              <div
                key={s.label}
                className="min-w-0 rounded-[var(--radius-card)] border border-white/14 bg-white/[0.06] px-2.5 py-2.5 sm:px-4 sm:py-3"
              >
                <dt className="font-body text-[10px] font-semibold uppercase leading-tight tracking-[0.02em] text-white/70 hyphens-auto sm:text-[11px] sm:tracking-[0.12em]">
                  {s.label}
                </dt>
                <dd data-numeric className="mt-1 truncate text-lg font-extrabold tabular-nums sm:text-xl">{s.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  )
}
