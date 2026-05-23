"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

type Pagamento = {
  aluno: { nome: string }
  mesReferencia: string
  formaPagamento: string | null
  valorRecebido: number | null
  dataPagamento: Date | null
}

type Custo = {
  data: Date
  categoria: string
  descricao: string
  fornecedor: string
  valor: number
  formaPagamento: string
}

type Props = {
  mes: string
  pagamentos: Pagamento[]
  custos: Custo[]
}

export function ExportarCaixaButton({ mes, pagamentos, custos }: Props) {
  function exportar() {
    const linhasPag = pagamentos.map((p) => [
      "Receita",
      p.aluno.nome,
      p.mesReferencia,
      p.formaPagamento ?? "",
      (p.valorRecebido ?? 0).toFixed(2),
      p.dataPagamento ? format(p.dataPagamento, "dd/MM/yyyy") : "",
    ])

    const linhasCusto = custos.map((c) => [
      "Custo",
      c.descricao,
      c.categoria,
      c.formaPagamento,
      c.valor.toFixed(2),
      format(c.data, "dd/MM/yyyy"),
    ])

    const cabecalho = ["Tipo", "Descrição/Aluno", "Ref/Categoria", "Forma", "Valor (R$)", "Data"]
    const linhas = [cabecalho, ...linhasPag, ...linhasCusto]
    const csv = linhas.map((l) => l.map((c) => `"${c}"`).join(";")).join("\n")
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `caixa-${mes}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" onClick={exportar}>
      <Download className="size-4" />
      Exportar CSV
    </Button>
  )
}
