"use client"

import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatMoney } from "@/lib/utils"

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

export function MatriculaButton({ aluno, nomeClube, endereco, cidade, telefoneClube }: Props) {
  function handleImprimir() {
    const fmt = (d: Date) => new Date(d).toLocaleDateString("pt-BR")

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
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
  .campo label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
  .campo span { font-size: 13px; font-weight: 500; border-bottom: 1px solid #ddd; padding-bottom: 2px; min-height: 20px; }
  .destaque { font-size: 18px; font-weight: bold; color: #C62828; }
  .obs { background: #fafafa; border: 1px solid #eee; border-radius: 4px; padding: 8px;
    font-size: 12px; min-height: 40px; }
  .assinaturas { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 48px; }
  .assinatura { text-align: center; }
  .assinatura .linha { border-top: 1px solid #333; padding-top: 6px; font-size: 11px; color: #555; }
  .rodape { text-align: center; font-size: 10px; color: #aaa; margin-top: 32px;
    border-top: 1px solid #eee; padding-top: 12px; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <div class="header">
    <h1>${nomeClube.toUpperCase()}</h1>
    <p>${endereco} · ${cidade}${telefoneClube ? ` · ${telefoneClube}` : ""}</p>
  </div>

  <div class="titulo">Contrato de Matrícula</div>

  <div class="secao">
    <div class="secao-titulo">Dados do Aluno</div>
    <div class="grid">
      <div class="campo"><label>Nome completo</label><span>${aluno.nome}</span></div>
      <div class="campo"><label>Data de nascimento</label><span>${fmt(aluno.dataNascimento)}</span></div>
      <div class="campo"><label>Turma</label><span>${aluno.turma}</span></div>
      <div class="campo"><label>Horário</label><span>${aluno.horario}</span></div>
    </div>
  </div>

  <div class="secao">
    <div class="secao-titulo">Dados do Responsável</div>
    <div class="grid">
      <div class="campo"><label>Nome do responsável</label><span>${aluno.responsavel}</span></div>
      <div class="campo"><label>Telefone</label><span>${aluno.telefone}</span></div>
      <div class="campo" style="grid-column:1/-1"><label>E-mail</label><span>${aluno.email}</span></div>
    </div>
  </div>

  <div class="secao">
    <div class="secao-titulo">Condições Financeiras</div>
    <div class="grid">
      <div class="campo"><label>Mensalidade</label><span class="destaque">${formatMoney(aluno.mensalidade)}</span></div>
      <div class="campo"><label>Data de matrícula</label><span>${fmt(aluno.dataMatricula)}</span></div>
      <div class="campo"><label>Vencimento</label><span>Todo dia 10 de cada mês</span></div>
      <div class="campo"><label>Forma de pagamento</label><span>PIX / Dinheiro / Transferência</span></div>
    </div>
  </div>

  ${aluno.observacoes ? `
  <div class="secao">
    <div class="secao-titulo">Observações</div>
    <div class="obs">${aluno.observacoes}</div>
  </div>` : ""}

  <div class="assinaturas">
    <div class="assinatura">
      <div style="height:48px"></div>
      <div class="linha">${aluno.responsavel}<br>Responsável pelo aluno</div>
    </div>
    <div class="assinatura">
      <div style="height:48px"></div>
      <div class="linha">${nomeClube}<br>Representante da Escola</div>
    </div>
  </div>

  <div class="rodape">
    Documento gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
  </div>
</body>
</html>`

    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(html)
    win.document.close()
    setTimeout(() => win.print(), 300)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleImprimir}>
      <FileText className="size-4" />
      Matrícula
    </Button>
  )
}
