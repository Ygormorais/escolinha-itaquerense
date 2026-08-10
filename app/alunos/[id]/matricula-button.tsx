"use client"

import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatMoney } from "@/lib/utils"
import { appendPrintElement, openPrintDocument } from "@/lib/browser-safety"

type Aluno = {
  nome: string
  dataNascimento: Date
  turma: string
  horario: string
  responsavel: string
  telefone: string
  email: string
  dataMatricula: Date
  mensalidade: number
  observacoes: string | null
}

type Props = {
  aluno: Aluno
  nomeClube: string
  endereco: string
  cidade: string
  telefoneClube: string
}

const MATRICULA_PRINT_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; padding: 40px; }
  .header { text-align: center; border-bottom: 3px solid #C62828; padding-bottom: 16px; margin-bottom: 24px; }
  .header h1 { font-size: 22px; color: #C62828; letter-spacing: 1px; }
  .header p { font-size: 11px; color: #666; margin-top: 4px; }
  .titulo { font-size: 15px; font-weight: bold; text-align: center; text-transform: uppercase;
    letter-spacing: 2px; margin-bottom: 20px; color: #333; }
  .secao { margin-bottom: 20px; }
  .secao-titulo { font-size: 11px; font-weight: bold; text-transform: uppercase;
    letter-spacing: 1px; color: #C62828; border-bottom: 1px solid #eee; padding-bottom: 4px; margin-bottom: 10px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
  .campo { display: flex; flex-direction: column; }
  .campo.span-full { grid-column: 1 / -1; }
  .campo label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
  .campo span { font-size: 13px; font-weight: 500; border-bottom: 1px solid #ddd; padding-bottom: 2px; min-height: 20px; }
  .campo .destaque { font-size: 18px; font-weight: bold; color: #C62828; }
  .obs { background: #fafafa; border: 1px solid #eee; border-radius: 4px; padding: 8px;
    font-size: 12px; min-height: 40px; white-space: pre-wrap; }
  .assinaturas { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 48px; }
  .assinatura { text-align: center; }
  .assinatura .espaco { height: 48px; }
  .assinatura .linha { border-top: 1px solid #333; padding-top: 6px; font-size: 11px; color: #555; white-space: pre-line; }
  .rodape { text-align: center; font-size: 10px; color: #aaa; margin-top: 32px;
    border-top: 1px solid #eee; padding-top: 12px; }
  @media print { body { padding: 20px; } }
`

function appendSection(document: Document, body: HTMLElement, title: string): HTMLDivElement {
  const section = appendPrintElement(document, body, "div", { className: "secao" })
  appendPrintElement(document, section, "div", { className: "secao-titulo", text: title })
  return section
}

function appendField(
  document: Document,
  grid: HTMLDivElement,
  label: string,
  value: string,
  options: { fullWidth?: boolean; highlight?: boolean } = {},
) {
  const field = appendPrintElement(document, grid, "div", {
    className: options.fullWidth ? "campo span-full" : "campo",
  })
  appendPrintElement(document, field, "label", { text: label })
  appendPrintElement(document, field, "span", {
    className: options.highlight ? "destaque" : undefined,
    text: value,
  })
}

export function MatriculaButton({ aluno, nomeClube, endereco, cidade, telefoneClube }: Props) {
  function handleImprimir() {
    const fmt = (d: Date) => new Date(d).toLocaleDateString("pt-BR")
    const generatedAt = new Date()

    openPrintDocument({
      title: `Contrato de Matrícula — ${aluno.nome}`,
      styles: MATRICULA_PRINT_STYLES,
      printDelayMs: 300,
      render(document, body) {
        const header = appendPrintElement(document, body, "div", { className: "header" })
        appendPrintElement(document, header, "h1", { text: nomeClube.toUpperCase() })
        appendPrintElement(document, header, "p", {
          text: [endereco, cidade, telefoneClube].filter(Boolean).join(" · "),
        })

        appendPrintElement(document, body, "div", {
          className: "titulo",
          text: "Contrato de Matrícula",
        })

        const alunoGrid = appendPrintElement(
          document,
          appendSection(document, body, "Dados do Aluno"),
          "div",
          { className: "grid" },
        )
        appendField(document, alunoGrid, "Nome completo", aluno.nome)
        appendField(document, alunoGrid, "Data de nascimento", fmt(aluno.dataNascimento))
        appendField(document, alunoGrid, "Turma", aluno.turma)
        appendField(document, alunoGrid, "Horário", aluno.horario)

        const responsavelGrid = appendPrintElement(
          document,
          appendSection(document, body, "Dados do Responsável"),
          "div",
          { className: "grid" },
        )
        appendField(document, responsavelGrid, "Nome do responsável", aluno.responsavel)
        appendField(document, responsavelGrid, "Telefone", aluno.telefone)
        appendField(document, responsavelGrid, "E-mail", aluno.email, { fullWidth: true })

        const financeiroGrid = appendPrintElement(
          document,
          appendSection(document, body, "Condições Financeiras"),
          "div",
          { className: "grid" },
        )
        appendField(document, financeiroGrid, "Mensalidade", formatMoney(aluno.mensalidade), {
          highlight: true,
        })
        appendField(document, financeiroGrid, "Data de matrícula", fmt(aluno.dataMatricula))
        appendField(document, financeiroGrid, "Vencimento", "Todo dia 10 de cada mês")
        appendField(document, financeiroGrid, "Forma de pagamento", "PIX / Dinheiro / Transferência")

        if (aluno.observacoes) {
          const observacoes = appendSection(document, body, "Observações")
          appendPrintElement(document, observacoes, "div", {
            className: "obs",
            text: aluno.observacoes,
          })
        }

        const assinaturas = appendPrintElement(document, body, "div", { className: "assinaturas" })
        for (const [nome, papel] of [
          [aluno.responsavel, "Responsável pelo aluno"],
          [nomeClube, "Representante da Escola"],
        ]) {
          const assinatura = appendPrintElement(document, assinaturas, "div", { className: "assinatura" })
          appendPrintElement(document, assinatura, "div", { className: "espaco" })
          appendPrintElement(document, assinatura, "div", {
            className: "linha",
            text: `${nome}\n${papel}`,
          })
        }

        appendPrintElement(document, body, "div", {
          className: "rodape",
          text: `Documento gerado em ${generatedAt.toLocaleDateString("pt-BR")} às ${generatedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
        })
      },
    })
  }

  return (
    <Button variant="outline" size="sm" onClick={handleImprimir}>
      <FileText className="size-4" />
      Matrícula
    </Button>
  )
}
