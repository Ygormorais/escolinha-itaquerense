"use client"

import Link from "next/link"
import { format } from "date-fns"
import { AlertTriangle, CheckCircle, CheckSquare, MessageCircle, Phone, Square } from "lucide-react"
import { formatMoney, formatPhone } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PixButton } from "@/components/ui/pix-modal"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { InadimplenciaVazia, type ListaInadimplentesProps } from "./inadimplencia-lista-mobile"
import { gerarLinkWA, resumirInadimplente } from "./inadimplencia-utils"

export function InadimplenciaTabela({
  inadimplentes,
  agora,
  buscando,
  selecionados,
  onToggle,
  onToggleTodos,
  onRegistrar,
  chavePix,
  nomeClube,
  cidade,
  templateCobranca,
}: ListaInadimplentesProps & { onToggleTodos: () => void }) {
  const todosSelecionados = selecionados.size === inadimplentes.length && inadimplentes.length > 0

  return (
    <div data-slot="delinquency-table" className="mt-4 hidden overflow-x-auto rounded-xl border bg-card md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <button onClick={onToggleTodos} aria-label="Selecionar todos" className="flex size-11 items-center justify-center rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15">
                {todosSelecionados
                  ? <CheckSquare className="size-4 text-brand-600" />
                  : <Square className="size-4 text-muted-foreground" />}
              </button>
            </TableHead>
            <TableHead>Aluno</TableHead>
            <TableHead>Turma</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead className="text-center">Meses em Aberto</TableHead>
            <TableHead className="text-right">Valor em Aberto</TableHead>
            <TableHead>Vencimento Mais Antigo</TableHead>
            <TableHead>Nível</TableHead>
            <TableHead>Cobrança</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {inadimplentes.length === 0 && (
            <TableRow>
              <TableCell colSpan={10}>
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <InadimplenciaVazia buscando={buscando} />
                </div>
              </TableCell>
            </TableRow>
          )}
          {inadimplentes.map((a) => {
            const { maisAntigo, isCritico, valorAberto } = resumirInadimplente(a, agora)
            const cobranca = a.pagamentos.find((p) => p.externalId)

            return (
              <TableRow
                key={a.alunoId}
                className={
                  selecionados.has(a.alunoId)
                    ? "bg-brand-50 dark:bg-brand-950/30"
                    : "hover:bg-muted/40 transition-colors"
                }
              >
                <TableCell>
                  <button onClick={() => onToggle(a.alunoId)} aria-label={`Selecionar ${a.nome}`} className="flex size-11 items-center justify-center rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15">
                    {selecionados.has(a.alunoId)
                      ? <CheckSquare className="size-4 text-brand-600" />
                      : <Square className="size-4 text-muted-foreground" />}
                  </button>
                </TableCell>
                <TableCell className="font-medium">
                  <Link href={`/alunos/${a.alunoId}`} className="hover:underline text-brand-800">{a.nome}</Link>
                </TableCell>
                <TableCell>{a.turma}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <a
                      href={`tel:${a.telefone}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-brand-800 hover:underline"
                    >
                      <Phone className="size-3" />
                      {formatPhone(a.telefone)}
                    </a>
                    <a
                      href={gerarLinkWA(a, nomeClube ?? "Escolinha", templateCobranca)}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-success-600 hover:underline"
                    >
                      <MessageCircle className="size-3" />
                      WhatsApp
                    </a>
                  </div>
                </TableCell>
                <TableCell className="text-center">{a.pagamentos.length}</TableCell>
                <TableCell className="text-right">
                  {formatMoney(valorAberto)}
                </TableCell>
                <TableCell className="text-danger-600">
                  {format(maisAntigo, "dd/MM/yyyy")}
                </TableCell>
                <TableCell>
                  {isCritico ? (
                    <Badge variant="destructive" className="inline-flex items-center gap-1">
                      <AlertTriangle className="size-3" /> Crítico
                    </Badge>
                  ) : (
                    <Badge className="inline-flex items-center gap-1 bg-warning-50 text-warning-600">
                      <AlertTriangle className="size-3" /> Atenção
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {cobranca ? (
                    <span className="text-xs text-muted-foreground">
                      {cobranca.canalPrevisto} · {cobranca.statusCobranca}
                    </span>
                  ) : (
                    <span className="text-xs text-warning-600">Sem cobrança</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Registrar pagamento"
                      onClick={() => onRegistrar(a)}
                    >
                      <CheckCircle className="size-4 text-success-600" />
                    </Button>
                    {chavePix && nomeClube && cidade && (
                      <PixButton
                        chave={chavePix}
                        nomeClube={nomeClube}
                        cidade={cidade}
                        valor={valorAberto}
                        descricao={`${a.pagamentos.length}x mensalidade ${a.nome.split(" ")[0]}`}
                        telefoneResponsavel={a.telefone}
                        nomeResponsavel={a.nome}
                        size="sm"
                      />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
