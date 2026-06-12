import { format } from "date-fns"
import { formatMoney } from "@/lib/utils"
import type { DeclaracaoAnual } from "@/lib/declaracao"

type Props = {
  declaracao: DeclaracaoAnual
  aluno: { nome: string; responsavel: string }
  clube: { nome: string; cidade: string }
}

export function DeclaracaoAnualDoc({ declaracao, aluno, clube }: Props) {
  return (
    <div className="mx-auto max-w-2xl bg-white p-8 text-sm text-black print:p-0">
      <header className="mb-6 border-b pb-4 text-center">
        <h1 className="font-heading text-xl font-extrabold">{clube.nome}</h1>
        <p className="text-muted-foreground">Declaração anual de pagamentos — {declaracao.ano}</p>
      </header>

      <p className="mb-4">
        Declaramos, para os devidos fins, que recebemos de{" "}
        <strong>{aluno.responsavel}</strong>, referente às mensalidades do aluno{" "}
        <strong>{aluno.nome}</strong>, os pagamentos abaixo relacionados no ano de {declaracao.ano}:
      </p>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-2 py-2">Referência</th>
            <th className="px-2 py-2">Data do pagamento</th>
            <th className="px-2 py-2">Forma</th>
            <th className="px-2 py-2 text-right">Valor</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {declaracao.linhas.map((l, i) => (
            <tr key={i}>
              <td className="px-2 py-2">{l.mesReferencia}</td>
              <td className="px-2 py-2">{format(l.dataPagamento, "dd/MM/yyyy")}</td>
              <td className="px-2 py-2">{l.formaPagamento ?? "—"}</td>
              <td className="px-2 py-2 text-right tabular-nums">{formatMoney(l.valorRecebido ?? 0)}</td>
            </tr>
          ))}
          <tr className="font-bold">
            <td className="px-2 py-2" colSpan={3}>Total no ano</td>
            <td className="px-2 py-2 text-right tabular-nums">{formatMoney(declaracao.total)}</td>
          </tr>
        </tbody>
      </table>

      <footer className="mt-8 text-xs text-muted-foreground">
        <p>{clube.cidade}, documento gerado em {format(new Date(), "dd/MM/yyyy")}.</p>
      </footer>
    </div>
  )
}
