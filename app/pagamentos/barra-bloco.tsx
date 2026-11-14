"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Loader2, Printer } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { registrarPagamentosLote } from "@/app/actions/pagamentos"
import type { AlunoDevedor } from "@/lib/central-pagamentos"
import { formatMoney, plural } from "@/lib/utils"
import { FORMAS_PAGAMENTO } from "./pagamentos-utils"

type Emitido = { pagamentoId: number; numero: string; codigoVerificacao: string }

/** Baixa de todas as mensalidades em aberto dos alunos marcados, de uma vez. */
export function BarraBloco({ alunos, onConcluir }: { alunos: AlunoDevedor[]; onConcluir: () => void }) {
  const router = useRouter()
  const [pendente, iniciar] = useTransition()
  const [forma, setForma] = useState("PIX")
  const [data, setData] = useState(() => format(new Date(), "yyyy-MM-dd"))
  const [emitidos, setEmitidos] = useState<Emitido[]>([])

  const ids = alunos.flatMap((a) => a.mensalidades.map((m) => m.id))
  const total = alunos.reduce((soma, a) => soma + a.totalRestante, 0)

  function confirmar() {
    iniciar(async () => {
      try {
        const r = await registrarPagamentosLote(ids, { dataPagamento: data, formaPagamento: forma })
        if ("error" in r) {
          toast.error(r.error)
          return
        }
        setEmitidos(r.recibos)
        onConcluir()
        router.refresh()
      } catch {
        toast.error("Erro ao dar baixa em bloco")
      }
    })
  }

  if (alunos.length === 0 && emitidos.length === 0) return null

  return (
    <div data-slot="barra-bloco" className="space-y-3 rounded-[var(--radius-card)] border border-border bg-card p-3">
      {alunos.length > 0 && (
        <div className="flex flex-wrap items-end gap-3">
          <p className="mr-auto text-sm" data-numeric>
            {plural(alunos.length, "aluno", "alunos", "nenhum")} · {plural(ids.length, "mensalidade", "mensalidades")} · <strong>{formatMoney(total)}</strong>
          </p>
          <div className="space-y-1">
            <label htmlFor="bloco-forma" className="text-xs font-medium">Forma</label>
            <select id="bloco-forma" value={forma} onChange={(e) => setForma(e.target.value)} className="h-11 rounded-[var(--radius-control)] border border-input bg-white px-3 text-sm">
              {FORMAS_PAGAMENTO.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="bloco-data" className="text-xs font-medium">Data</label>
            <Input id="bloco-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <Button type="button" onClick={confirmar} disabled={pendente} className="bg-brand-800 text-white hover:bg-brand-900">
            {pendente ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : "Dar baixa em todos"}
          </Button>
        </div>
      )}
      {emitidos.length > 0 && (
        <div role="status" className="space-y-1">
          <p className="text-sm font-semibold text-success-600">Baixa em bloco registrada · {plural(emitidos.length, "recibo", "recibos", "nenhum")}</p>
          <ul className="flex flex-wrap gap-2">
            {emitidos.map((r) => (
              <li key={r.numero}>
                <a href={`/recibos?codigo=${r.codigoVerificacao}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-muted">
                  <Printer className="size-3" /> {r.numero}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
