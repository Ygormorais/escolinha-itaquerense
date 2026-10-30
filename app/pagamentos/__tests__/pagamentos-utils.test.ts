import { describe, expect, it } from "vitest"
import {
  urlImpressaoRecibo,
  filtrarPagamentos,
  gerarCSVPagamentos,
  getPagamentoStatus,
  linkCobrancaWhatsApp,
  mensagemLembreteVencimento,
  resumirPagamentos,
  turmasDosPagamentos,
  urlReciboPago,
  vencendoNaSemana,
  type Pagamento,
} from "@/app/pagamentos/pagamentos-utils"

const AGORA = new Date("2026-10-16T12:00:00Z")

function pagamento(id: number, extra: Partial<Pagamento> & { nome?: string; turma?: string; telefone?: string } = {}): Pagamento {
  const { nome = `Aluno ${id}`, turma = "Sub-11", telefone = "(11) 98888-7777", ...resto } = extra
  return {
    id,
    mesReferencia: "2026-10",
    dataVencimento: new Date("2026-10-20T12:00:00Z"),
    dataPagamento: null,
    formaPagamento: null,
    valorRecebido: null,
    aluno: { id, nome, turma, mensalidade: 150, telefone },
    canalPrevisto: null,
    statusCobranca: null,
    externalId: null,
    pixCopiaECola: null,
    linhaDigitavel: null,
    externalUrl: null,
    ...resto,
  }
}

const pago = pagamento(1, { nome: "Pedro Souza", dataPagamento: new Date("2026-10-09T12:00:00Z"), valorRecebido: 140, formaPagamento: "PIX" })
const vencido = pagamento(2, { nome: "Ana Lima", turma: "Sub-9", dataVencimento: new Date("2026-10-05T12:00:00Z") })
const pendente = pagamento(3, { nome: "Lia Costa" })
const pendenteLonge = pagamento(4, { nome: "Rui Alves", dataVencimento: new Date("2026-11-30T12:00:00Z") })

describe("getPagamentoStatus", () => {
  it("classifica pago, vencido e pendente", () => {
    expect(getPagamentoStatus(pago, AGORA)).toBe("Pago")
    expect(getPagamentoStatus(vencido, AGORA)).toBe("Vencido")
    expect(getPagamentoStatus(pendente, AGORA)).toBe("Pendente")
  })

  it("considera pago mesmo com vencimento no passado", () => {
    expect(getPagamentoStatus({ ...vencido, dataPagamento: AGORA }, AGORA)).toBe("Pago")
  })
})

describe("resumirPagamentos", () => {
  it("soma o recebido e calcula a adimplência", () => {
    expect(resumirPagamentos([pago, vencido, pendente, pendenteLonge], AGORA)).toEqual({
      totalPago: 140,
      totalPendente: 2,
      totalVencido: 1,
      taxaAdimplencia: 25,
    })
  })

  it("devolve zeros para mês sem pagamentos", () => {
    expect(resumirPagamentos([], AGORA)).toEqual({ totalPago: 0, totalPendente: 0, totalVencido: 0, taxaAdimplencia: 0 })
  })
})

describe("filtrarPagamentos", () => {
  const todos = [pago, vencido, pendente]

  it("busca pelo nome sem diferenciar maiúsculas", () => {
    expect(filtrarPagamentos(todos, { search: "lia", status: "Todos", turma: "Todas" }, AGORA)).toEqual([pendente])
  })

  it("combina status e turma", () => {
    expect(filtrarPagamentos(todos, { search: "", status: "Vencido", turma: "Sub-9" }, AGORA)).toEqual([vencido])
    expect(filtrarPagamentos(todos, { search: "", status: "Pago", turma: "Sub-9" }, AGORA)).toEqual([])
  })
})

describe("turmasDosPagamentos", () => {
  it("lista as turmas sem repetir, em ordem", () => {
    expect(turmasDosPagamentos([pago, vencido, pendente])).toEqual(["Sub-11", "Sub-9"])
  })
})

describe("vencendoNaSemana", () => {
  it("inclui só os não pagos que vencem nos próximos 7 dias", () => {
    expect(vencendoNaSemana([pago, vencido, pendente, pendenteLonge], AGORA)).toEqual([pendente])
  })
})

describe("mensagens e links", () => {
  it("monta o lembrete de vencimento com valor e chave PIX", () => {
    const msg = mensagemLembreteVencimento(pendente, "pix@clube")
    expect(msg).toContain("*Lia Costa* (Sub-11) vence em *20/10/2026*")
    expect(msg).toContain("Valor: *R$ 150,00*")
    expect(msg).toContain("Chave PIX: *pix@clube*")
  })

  it("omite a chave PIX quando o clube não tem", () => {
    expect(mensagemLembreteVencimento(pendente)).not.toContain("Chave PIX")
  })

  it("monta o link de cobrança com o telefone só com dígitos", () => {
    const link = linkCobrancaWhatsApp(vencido)
    expect(link.startsWith("https://wa.me/5511988887777?text=")).toBe(true)
    expect(decodeURIComponent(link.split("text=")[1])).toContain("*Ana Lima* referente a *2026-10* está em aberto")
  })

  it("monta a URL do recibo com o valor recebido e a data do pagamento", () => {
    expect(urlReciboPago(pago)).toBe("/recibos?aluno=Pedro%20Souza&referencia=2026-10&valor=140&forma=PIX&data=2026-10-09")
  })
})

describe("gerarCSVPagamentos", () => {
  it("gera cabeçalho e linhas separadas por ponto e vírgula", () => {
    const linhas = gerarCSVPagamentos([pago, vencido], AGORA).split("\n")
    expect(linhas[0]).toBe('"Nome";"Turma";"Mês Ref.";"Mensalidade (R$)";"Vencimento";"Data Pagamento";"Forma";"Status"')
    expect(linhas[1]).toContain('"Pedro Souza";"Sub-11";"2026-10";"150.00"')
    expect(linhas[1]).toContain('"PIX";"Pago"')
    expect(linhas[2]).toContain('"";"";"Vencido"')
  })

  it("neutraliza nomes que o Excel interpretaria como fórmula", () => {
    const csv = gerarCSVPagamentos([pagamento(9, { nome: "=HYPERLINK(1)" })], AGORA)
    expect(csv).toContain(`"'=HYPERLINK(1)"`)
  })
})

describe("urlImpressaoRecibo", () => {
  const dados = { aluno: "Ana Souza", referencia: "2026-06", valor: "120", forma: "PIX", data: "2026-06-10" }

  it("leva o número e o código do recibo já emitido pela baixa", () => {
    const url = new URL(urlImpressaoRecibo(dados, { numero: "REC-2026-AB", codigoVerificacao: "COD9" }), "http://x")
    expect(url.pathname).toBe("/recibos")
    expect(url.searchParams.get("numero")).toBe("REC-2026-AB")
    expect(url.searchParams.get("codigo")).toBe("COD9")
    expect(url.searchParams.get("aluno")).toBe("Ana Souza")
  })

  it("sem recibo emitido, só preenche os dados", () => {
    const url = new URL(urlImpressaoRecibo(dados, null), "http://x")
    expect(url.searchParams.has("codigo")).toBe(false)
  })
})
