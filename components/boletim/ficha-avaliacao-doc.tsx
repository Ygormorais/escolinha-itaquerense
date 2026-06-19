import type { DadosFichaAvaliacao } from "@/lib/ficha-avaliacao"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

function notaColor(nota: number | null): string {
  if (nota === null) return "text-muted-foreground"
  if (nota >= 7) return "text-success-600"
  if (nota >= 5) return "text-warning-600"
  return "text-danger-600"
}

function bgNotaColor(nota: number | null): string {
  if (nota === null) return "bg-muted"
  if (nota >= 7) return "bg-success-50"
  if (nota >= 5) return "bg-warning-50"
  return "bg-danger-50"
}

function freqBarColor(freq: number | null): string {
  if (freq === null) return "bg-muted-foreground/30"
  if (freq >= 75) return "bg-success-600"
  if (freq >= 50) return "bg-warning-600"
  return "bg-danger-600"
}

type Props = { dados: DadosFichaAvaliacao }

export function FichaAvaliacaoDoc({ dados }: Props) {
  const { aluno, avaliacao: av, clube } = dados
  const hoje = format(new Date(), "dd/MM/yyyy", { locale: ptBR })

  return (
    <div className="mx-auto max-w-2xl bg-white p-8 text-sm text-black shadow print:p-0 print:shadow-none">
      {/* Cabeçalho */}
      <header className="mb-6 border-b pb-4 text-center">
        <h1 className="font-heading text-xl font-extrabold">{clube.nome}</h1>
        <p className="text-xs text-gray-500">{clube.cidade}</p>
        <p className="mt-1 text-base font-semibold">Ficha de Avaliação</p>
      </header>

      {/* Identificação */}
      <section className="mb-6 grid grid-cols-3 gap-4 rounded-lg border border-gray-200 p-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Atleta</p>
          <p className="mt-0.5 font-semibold">{aluno.nome}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Turma</p>
          <p className="mt-0.5 font-semibold">{aluno.turma}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Período</p>
          <p className="mt-0.5 font-semibold">{av.periodo}</p>
        </div>
      </section>

      {/* Notas */}
      <section className="mb-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Notas</h2>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { label: "Técnica", valor: av.notaTecnica },
              { label: "Física", valor: av.notaFisica },
              { label: "Comportamento", valor: av.notaComportamento },
              { label: "Média Geral", valor: av.media },
            ] as { label: string; valor: number | null }[]
          ).map(({ label, valor }) => (
            <div key={label} className={`rounded-lg p-3 ${bgNotaColor(valor)}`}>
              <p className="mb-1 text-xs text-gray-500">{label}</p>
              <p className={`text-2xl font-bold ${notaColor(valor)}`}>
                {valor !== null ? valor.toFixed(1) : "—"}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Frequência */}
      <section className="mb-6">
        <div className="mb-1.5 flex items-center justify-between text-xs text-gray-500">
          <span className="font-semibold uppercase tracking-wider">Frequência</span>
          <span>{av.frequencia !== null ? `${av.frequencia.toFixed(0)}%` : "—"}</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all ${freqBarColor(av.frequencia)}`}
            style={{ width: av.frequencia !== null ? `${av.frequencia}%` : "0%" }}
          />
        </div>
      </section>

      {/* Observações */}
      {av.observacoes && (
        <section className="mb-6 rounded-lg border border-gray-200 p-4">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Observações</p>
          <p className="text-xs italic leading-relaxed text-gray-600">{av.observacoes}</p>
        </section>
      )}

      {/* Rodapé */}
      <footer className="mt-10 border-t pt-4">
        <div className="flex items-end justify-between">
          <p className="text-[10px] text-gray-400">Documento gerado em {hoje}</p>
          <div className="text-center">
            <div className="mb-1 w-48 border-b border-gray-400" />
            <p className="text-[10px] text-gray-400">Treinador responsável</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
