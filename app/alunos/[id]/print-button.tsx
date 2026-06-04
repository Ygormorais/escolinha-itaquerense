"use client"

import { PrinterIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { printHTML } from "@/lib/print"

export function AlunoPrintButton({ alunoId }: { alunoId: number }) {
  async function handlePrint() {
    try {
      const res = await fetch(`/api/alunos/${alunoId}/print`)
      if (!res.ok) return
      const data = await res.json()
      if ("error" in data) return

      const pagamentosHtml = data.pagamentos.map((p: { mesReferencia: string; valorRecebido: number | null; dataPagamento: string | null; formaPagamento: string | null }) =>
        `<tr><td>${p.mesReferencia}</td><td>${p.valorRecebido ? `R$ ${p.valorRecebido.toFixed(2)}` : "—"}</td><td>${p.dataPagamento ? new Date(p.dataPagamento).toLocaleDateString("pt-BR") : "—"}</td><td>${p.formaPagamento ?? "—"}</td></tr>`
      ).join("")

      const frequenciasHtml = data.frequencias.map((f: { data: string; presenca: string }) =>
        `<tr><td>${new Date(f.data).toLocaleDateString("pt-BR")}</td><td><span class="badge ${f.presenca === "Presente" ? "badge-success" : f.presenca === "Justificado" ? "badge-warning" : "badge-danger"}">${f.presenca}</span></td></tr>`
      ).join("")

      const pctPresenca = data.frequencias.length > 0
        ? Math.round((data.frequencias.filter((f: { presenca: string }) => f.presenca === "Presente").length / data.frequencias.length) * 100)
        : 0

      printHTML(`
        <h1>${data.nome}</h1>
        <p>Histórico completo do aluno</p>
        <dl class="info">
          <div><dt>Turma</dt><dd>${data.turma}</dd></div>
          <div><dt>Horário</dt><dd>${data.horario}</dd></div>
          <div><dt>Responsável</dt><dd>${data.responsavel}</dd></div>
          <div><dt>Telefone</dt><dd>${data.telefone}</dd></div>
          <div><dt>Mensalidade</dt><dd>R$ ${data.mensalidade.toFixed(2)}</dd></div>
          <div><dt>Status</dt><dd><span class="badge ${data.status === "Ativo" ? "badge-success" : "badge-danger"}">${data.status}</span></dd></div>
          <div><dt>% Presença</dt><dd>${pctPresenca}%</dd></div>
        </dl>
        <h2>Pagamentos</h2>
        <table>
          <thead><tr><th>Mês</th><th>Valor</th><th>Data Pagamento</th><th>Forma</th></tr></thead>
          <tbody>${pagamentosHtml || '<tr><td colspan="4">Nenhum pagamento registrado.</td></tr>'}</tbody>
        </table>
        <h2 style="margin-top: 20px;">Frequência</h2>
        <table>
          <thead><tr><th>Data</th><th>Presença</th></tr></thead>
          <tbody>${frequenciasHtml || '<tr><td colspan="2">Nenhuma frequência registrada.</td></tr>'}</tbody>
        </table>
      `, `Histórico — ${data.nome}`)
    } catch {
      // ignore
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handlePrint}>
      <PrinterIcon className="size-4" />
      Histórico PDF
    </Button>
  )
}
