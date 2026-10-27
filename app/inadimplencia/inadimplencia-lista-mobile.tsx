"use client"

import Link from "next/link"
import { format } from "date-fns"
import { AlertTriangle, CheckCircle, CheckSquare, MessageCircle, Phone, Search, Square } from "lucide-react"
import { formatMoney } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PixButton } from "@/components/ui/pix-modal"
import { gerarLinkWA, resumirInadimplente, type Inadimplente } from "./inadimplencia-utils"

export type ListaInadimplentesProps = {
  inadimplentes: Inadimplente[]
  agora: Date
  buscando: boolean
  selecionados: Set<number>
  onToggle: (alunoId: number) => void
  onRegistrar: (inadimplente: Inadimplente) => void
  chavePix?: string
  nomeClube?: string
  cidade?: string
  templateCobranca?: string
}

export function InadimplenciaVazia({ buscando }: { buscando: boolean }) {
  return (
    <>
      {buscando ? <Search className="size-8 text-muted-foreground/30" /> : <CheckCircle className="size-8 text-success-600/60" />}
      <p className="text-sm text-muted-foreground">
        {buscando ? "Nenhum resultado para a busca" : "Nenhum aluno inadimplente 🎉"}
      </p>
    </>
  )
}

export function InadimplenciaListaMobile({
  inadimplentes,
  agora,
  buscando,
  selecionados,
  onToggle,
  onRegistrar,
  chavePix,
  nomeClube,
  cidade,
  templateCobranca,
}: ListaInadimplentesProps) {
  return (
    <div data-slot="delinquency-mobile-list" className="mt-4 grid gap-3 md:hidden">
      {inadimplentes.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-card)] border bg-card py-10 text-center">
          <InadimplenciaVazia buscando={buscando} />
        </div>
      )}
      {inadimplentes.map((a) => {
        const { maisAntigo, isCritico, valorAberto } = resumirInadimplente(a, agora)

        return (
          <article key={a.alunoId} className={selecionados.has(a.alunoId) ? "min-w-0 rounded-[var(--radius-card)] border border-brand-200 bg-brand-50/40 p-4" : "min-w-0 rounded-[var(--radius-card)] border bg-card p-4 shadow-sm"}>
            <div className="flex min-w-0 items-start gap-3">
              <button onClick={() => onToggle(a.alunoId)} aria-label={`Selecionar ${a.nome}`} className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15">
                {selecionados.has(a.alunoId) ? <CheckSquare className="size-5 text-brand-600" /> : <Square className="size-5 text-muted-foreground" />}
              </button>
              <div className="min-w-0 flex-1">
                <Link href={`/alunos/${a.alunoId}`} className="block truncate font-semibold text-brand-800 hover:underline">{a.nome}</Link>
                <p className="mt-1 text-sm text-muted-foreground">{a.turma} · venc. {format(maisAntigo, "dd/MM/yyyy")}</p>
              </div>
              {isCritico ? (
                <Badge variant="destructive" className="inline-flex shrink-0 items-center gap-1"><AlertTriangle className="size-3" />Crítico</Badge>
              ) : (
                <Badge className="inline-flex shrink-0 items-center gap-1 bg-warning-50 text-warning-700"><AlertTriangle className="size-3" />Atenção</Badge>
              )}
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-xs text-muted-foreground">Meses em aberto</dt><dd data-numeric className="font-semibold">{a.pagamentos.length}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Valor em aberto</dt><dd data-numeric className="font-semibold text-danger-600">{formatMoney(valorAberto)}</dd></div>
            </dl>
            <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-3">
              <a href={`tel:${a.telefone}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border px-3 text-sm font-medium text-brand-800"><Phone className="size-4" />Ligar</a>
              <a href={gerarLinkWA(a, nomeClube ?? "Escolinha", templateCobranca)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border px-3 text-sm font-medium text-success-600"><MessageCircle className="size-4" />WhatsApp</a>
              <Button variant="outline" className="w-full" onClick={() => onRegistrar(a)}><CheckCircle className="size-4 text-success-600" />Registrar</Button>
              {chavePix && nomeClube && cidade ? (
                <div className="flex min-w-0 justify-center">
                  <PixButton chave={chavePix} nomeClube={nomeClube} cidade={cidade} valor={valorAberto} descricao={`${a.pagamentos.length}x mensalidade ${a.nome.split(" ")[0]}`} telefoneResponsavel={a.telefone} nomeResponsavel={a.nome} size="sm" />
                </div>
              ) : <span />}
            </div>
          </article>
        )
      })}
    </div>
  )
}
