import Link from "next/link"
import { CheckCircle } from "lucide-react"

/** Dar baixa acontece na central de pagamentos, com o aluno já aberto. */
export function PagamentoButton({ alunoId }: { alunoId: number }) {
  return (
    <Link
      href={`/pagamentos?aluno=${alunoId}`}
      className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-xs font-medium hover:bg-muted"
    >
      <CheckCircle className="size-3 text-success-600" />
      Pagar
    </Link>
  )
}
