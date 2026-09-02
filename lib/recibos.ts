import { createHash, randomBytes } from "node:crypto"

export type DadosIntegridadeRecibo = {
  numero: string
  codigoVerificacao: string
  alunoNome: string
  responsavel: string
  mesReferencia: string
  valor: number
  formaPagamento: string
  dataPagamento: Date | string
}

export function gerarCodigoVerificacao() {
  return randomBytes(9).toString("base64url").toUpperCase()
}

export function gerarNumeroRecibo() {
  const ano = new Date().getFullYear()
  const sufixo = `${Date.now().toString(36)}${randomBytes(2).toString("hex")}`.toUpperCase()
  return `REC-${ano}-${sufixo}`
}

export function calcularHashRecibo(dados: DadosIntegridadeRecibo) {
  const data = new Date(dados.dataPagamento).toISOString().slice(0, 10)
  const canonico = [
    dados.numero,
    dados.codigoVerificacao,
    dados.alunoNome.trim(),
    dados.responsavel.trim(),
    dados.mesReferencia.trim(),
    Number(dados.valor).toFixed(2),
    dados.formaPagamento.trim(),
    data,
  ].join("|")
  return createHash("sha256").update(canonico, "utf8").digest("hex")
}
