import Link from "next/link"
import { cn } from "@/lib/utils"

/** Um dos 4 números do Início: rótulo, valor e uma linha de apoio. Cor só para atenção. */
export function NumeroInicio({
  rotulo,
  valor,
  detalhe,
  atencao = false,
  href,
}: {
  rotulo: string
  valor: string
  detalhe?: string
  /** true pinta o valor de vermelho (ex.: atraso maior que zero). */
  atencao?: boolean
  href?: string
}) {
  const conteudo = (
    <>
      <p className="text-sm text-muted-foreground">{rotulo}</p>
      <p data-numeric className={cn("mt-1 text-3xl font-extrabold leading-tight", atencao ? "text-danger-600" : "text-foreground")}>
        {valor}
      </p>
      {detalhe && <p className="mt-1 text-xs text-muted-foreground">{detalhe}</p>}
    </>
  )
  const classe = "block rounded-[var(--radius-card)] border border-border bg-card p-4"
  return href ? (
    <Link href={href} className={cn(classe, "transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")}>
      {conteudo}
    </Link>
  ) : (
    <div className={classe}>{conteudo}</div>
  )
}
