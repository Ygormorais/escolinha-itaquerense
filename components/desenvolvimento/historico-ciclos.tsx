import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { EncerrarCiclo } from "@/components/desenvolvimento/encerrar-ciclo"
import { AcompanhamentoFrequenciaAcao } from "@/components/desenvolvimento/acompanhamento-frequencia"

export type CicloHistoricoView = {
  id: number
  alunoId: number
  alunoNome: string
  turma: string
  titulo: string
  status: "pendente" | "concluida" | "ignorada"
  observacao: string | null
  usuario: string | null
  planoSemanal: string[] | null
  cicloInicio: string
  updatedAt: string
}

const statusLabel = { pendente: "Pendente", concluida: "Concluída", ignorada: "Ignorada" } as const

export function HistoricoCiclos({ itens, mostrarAtleta = true, onEncerrado }: { itens: CicloHistoricoView[]; mostrarAtleta?: boolean; onEncerrado?: (id: number) => void }) {
  if (itens.length === 0) return <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">Nenhum ciclo registrado. As ações adicionadas à fila aparecerão aqui.</p>
  return (
    <ol className="space-y-3">
      {itens.map((item) => (
        <li key={item.id} className="min-w-0 rounded-xl border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">{item.titulo}</p>
            <Badge variant={item.status === "concluida" ? "success" : "outline"}>{statusLabel[item.status]}</Badge>
          </div>
          {mostrarAtleta && <Link href={`/alunos/${item.alunoId}`} className="mt-1 inline-block text-sm text-brand-700 hover:underline">{item.alunoNome} · {item.turma}</Link>}
          <p className="mt-1 text-xs text-muted-foreground">Semana de {/^\d{4}-\d{2}-\d{2}$/.test(item.cicloInicio) ? item.cicloInicio.split("-").reverse().join("/") : "data não registrada"} · Atualizado em <time dateTime={item.updatedAt}>{new Date(item.updatedAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</time>{item.usuario ? ` por ${item.usuario}` : ""}</p>
          {item.observacao && <p className="mt-3 whitespace-pre-wrap break-words text-sm"><strong>{item.status === "concluida" ? "Resultado registrado:" : item.status === "ignorada" ? "Justificativa:" : "Registro da equipe:"}</strong> {item.observacao}</p>}
          {item.planoSemanal && item.planoSemanal.length > 0 && <details className="mt-3 text-sm"><summary className="cursor-pointer font-medium">Ver plano aprovado</summary><ul className="mt-2 list-disc space-y-1 pl-5">{item.planoSemanal.map((acao, index) => <li key={index} className="break-words">{acao}</li>)}</ul></details>}
          {item.status === "pendente" && <EncerrarCiclo id={item.id} titulo={item.titulo} alunoNome={item.alunoNome} updatedAt={item.updatedAt} onEncerrado={onEncerrado} />}
          {item.status === "concluida" && <AcompanhamentoFrequenciaAcao key={`${item.id}:${item.updatedAt}`} acaoId={item.id} />}
        </li>
      ))}
    </ol>
  )
}
