import { describe, expect, it } from "vitest"
import {
  calcularNps,
  campanhaAberta,
  campanhaSchema,
  categoriaDaNota,
  conflitaComOutraCampanha,
  deveEnviarLembrete,
  faixaDoNps,
  filtrarPorTurma,
  listarDetratores,
  npsPorTurma,
  podeResponder,
  respostaSchema,
  rotuloRespondente,
  situacaoDaCampanha,
  type RespostaPainel,
} from "@/lib/satisfacao"

const d = (s: string) => new Date(`${s}T00:00:00.000Z`)

describe("categoriaDaNota", () => {
  it.each([[0, "detrator"], [6, "detrator"], [7, "neutro"], [8, "neutro"], [9, "promotor"], [10, "promotor"]] as const)("nota %i é %s", (n, c) => {
    expect(categoriaDaNota(n)).toBe(c)
  })
})

describe("calcularNps", () => {
  it("sem respostas, NPS é nulo", () => {
    expect(calcularNps([])).toMatchObject({ total: 0, nps: null })
  })
  it("promotores menos detratores em percentual", () => {
    // 5 promotores, 3 neutros, 2 detratores: (5-2)/10 = 30
    const r = calcularNps([10, 10, 9, 9, 9, 8, 7, 7, 6, 0])
    expect(r).toMatchObject({ total: 10, promotores: 5, neutros: 3, detratores: 2, nps: 30 })
    expect(r.distribuicao).toHaveLength(11)
    expect(r.distribuicao[9]).toBe(3)
    expect(r.distribuicao[0]).toBe(1)
  })
  it("só detratores dá -100 e só promotores dá 100", () => {
    expect(calcularNps([0, 3, 6]).nps).toBe(-100)
    expect(calcularNps([9, 10]).nps).toBe(100)
  })
  it("arredonda e ignora notas inválidas", () => {
    expect(calcularNps([10, 7, 7]).nps).toBe(33)
    expect(calcularNps([11, -1, 5.5, 10])).toMatchObject({ total: 1, nps: 100 })
  })
})

describe("faixaDoNps", () => {
  it("classifica", () => {
    expect(faixaDoNps(null)).toBe("sem-dados")
    expect(faixaDoNps(75)).toBe("excelente")
    expect(faixaDoNps(0)).toBe("bom")
    expect(faixaDoNps(-20)).toBe("atencao")
    expect(faixaDoNps(-80)).toBe("critico")
  })
})

describe("campanha e elegibilidade", () => {
  const c = { inicio: d("2026-12-01"), fim: d("2026-12-15") }
  it("aberta do início ao fim, inclusive", () => {
    expect(campanhaAberta(c, "2026-11-30")).toBe(false)
    expect(campanhaAberta(c, "2026-12-01")).toBe(true)
    expect(campanhaAberta(c, "2026-12-15")).toBe(true)
    expect(campanhaAberta(c, "2026-12-16")).toBe(false)
  })
  it("encerrada pelo admin fecha na hora", () => {
    expect(campanhaAberta({ ...c, encerradaEm: new Date() }, "2026-12-05")).toBe(false)
  })
  it("só responde quem tem atleta ativo e ainda não respondeu", () => {
    const base = { campanha: c, hoje: "2026-12-05", alunosAtivos: 1, jaRespondeu: false }
    expect(podeResponder(base)).toBe(true)
    expect(podeResponder({ ...base, jaRespondeu: true })).toBe(false)
    expect(podeResponder({ ...base, alunosAtivos: 0 })).toBe(false)
    expect(podeResponder({ ...base, hoje: "2027-01-01" })).toBe(false)
  })
  it("situação da campanha", () => {
    expect(situacaoDaCampanha(c, "2026-11-20")).toBe("agendada")
    expect(situacaoDaCampanha(c, "2026-12-10")).toBe("aberta")
    expect(situacaoDaCampanha(c, "2026-12-20")).toBe("encerrada")
    expect(situacaoDaCampanha({ ...c, encerradaEm: new Date() }, "2026-12-10")).toBe("encerrada")
  })
  it("uma campanha por vez", () => {
    expect(conflitaComOutraCampanha([], "2026-12-01")).toBe(false)
    expect(conflitaComOutraCampanha([c], "2026-12-10")).toBe(true)
    expect(conflitaComOutraCampanha([c], "2026-12-16")).toBe(false)
    expect(conflitaComOutraCampanha([{ ...c, encerradaEm: new Date() }], "2026-12-10")).toBe(false)
  })
})

describe("deveEnviarLembrete", () => {
  const c = { inicio: d("2026-12-01"), fim: d("2026-12-20"), lembrete: true, lembreteEnviadoEm: null }
  it("só nos últimos 3 dias, uma vez, e se ligado", () => {
    expect(deveEnviarLembrete(c, "2026-12-10")).toBe(false)
    expect(deveEnviarLembrete(c, "2026-12-17")).toBe(true)
    expect(deveEnviarLembrete(c, "2026-12-20")).toBe(true)
    expect(deveEnviarLembrete({ ...c, lembreteEnviadoEm: new Date() }, "2026-12-18")).toBe(false)
    expect(deveEnviarLembrete({ ...c, lembrete: false }, "2026-12-18")).toBe(false)
    expect(deveEnviarLembrete(c, "2026-12-21")).toBe(false)
  })
  it("campanha curta lembra já no primeiro dia", () => {
    expect(deveEnviarLembrete({ ...c, fim: d("2026-12-02") }, "2026-12-01")).toBe(true)
  })
})

describe("validação", () => {
  it("resposta: nota inteira de 0 a 10 e comentário limitado", () => {
    expect(respostaSchema.safeParse({ pesquisaId: 1, nota: 10 }).success).toBe(true)
    expect(respostaSchema.safeParse({ pesquisaId: 1, nota: 11 }).success).toBe(false)
    expect(respostaSchema.safeParse({ pesquisaId: 1, nota: -1 }).success).toBe(false)
    expect(respostaSchema.safeParse({ pesquisaId: 1, nota: 7.5 }).success).toBe(false)
    expect(respostaSchema.safeParse({ pesquisaId: 1, nota: 5, comentario: "x".repeat(501) }).success).toBe(false)
  })
  it("campanha: período coerente e de até 90 dias", () => {
    const ok = { titulo: "Pesquisa do 1º semestre", inicio: "2026-12-01", fim: "2026-12-15" }
    expect(campanhaSchema.safeParse(ok).success).toBe(true)
    expect(campanhaSchema.safeParse({ ...ok, fim: "2026-11-30" }).success).toBe(false)
    expect(campanhaSchema.safeParse({ ...ok, fim: "2027-04-01" }).success).toBe(false)
    expect(campanhaSchema.safeParse({ ...ok, inicio: "2026-02-31" }).success).toBe(false)
    expect(campanhaSchema.safeParse({ ...ok, titulo: "ab" }).success).toBe(false)
  })
})

const resp = (id: number, nota: number, turmas: string, extra: Partial<RespostaPainel> = {}): RespostaPainel => ({
  id,
  nota,
  comentario: null,
  turmas,
  anonimo: false,
  createdAt: new Date(2026, 11, id),
  responsavel: { id, nome: `Maria Souza ${id}`, telefone: "(11) 91234-5678" },
  ...extra,
})

describe("painel", () => {
  const todas = [resp(1, 10, "Sub-9"), resp(2, 3, "Sub-9,Sub-11"), resp(3, 8, "Sub-11"), resp(4, 5, "Sub-11")]
  it("filtra por turma, contando famílias com duas turmas nas duas", () => {
    expect(filtrarPorTurma(todas, "Sub-9").map((r) => r.id)).toEqual([1, 2])
    expect(filtrarPorTurma(todas, "Sub-11").map((r) => r.id)).toEqual([2, 3, 4])
    expect(filtrarPorTurma(todas, null)).toHaveLength(4)
  })
  it("NPS por turma começa pela pior", () => {
    const [primeira, segunda] = npsPorTurma(todas)
    expect(primeira).toMatchObject({ turma: "Sub-11", nps: -67, total: 3 })
    expect(segunda).toMatchObject({ turma: "Sub-9", nps: 0, total: 2 })
  })
  it("detratores: do mais insatisfeito, com WhatsApp acolhedor e nome", () => {
    const lista = listarDetratores(todas, { clube: "E.C. Itaquerense" })
    expect(lista.map((x) => x.id)).toEqual([2, 4])
    expect(lista[0].nome).toBe("Maria Souza 2")
    expect(lista[0].whatsappHref).toContain("https://wa.me/5511912345678?text=")
    expect(decodeURIComponent(lista[0].whatsappHref!)).toContain("Olá, Maria!")
    expect(decodeURIComponent(lista[0].whatsappHref!)).toContain("E.C. Itaquerense")
  })
  it("resposta anônima ou exibição anonimizada não expõe nome nem contato", () => {
    const anonima = listarDetratores([resp(1, 2, "Sub-9", { anonimo: true })], { clube: "X" })[0]
    expect(anonima).toMatchObject({ nome: null, whatsappHref: null })
    const oculta = listarDetratores([resp(1, 2, "Sub-9")], { clube: "X", anonimizar: true })[0]
    expect(oculta).toMatchObject({ nome: null, whatsappHref: null })
    expect(rotuloRespondente(null)).toBe("Família anônima")
  })
  it("telefone inválido: sem link, mas o detrator continua na lista", () => {
    const [x] = listarDetratores([resp(1, 1, "Sub-9", { responsavel: { id: 1, nome: "Ana", telefone: "123" } })], { clube: "X" })
    expect(x.whatsappHref).toBeNull()
    expect(x.nome).toBe("Ana")
  })
  it("usa o modelo personalizado quando existe", () => {
    const [x] = listarDetratores([resp(1, 1, "Sub-9")], { clube: "Clube Z", modelos: { satisfacao: "Oi {responsavel}, aqui é {clube}" } })
    expect(decodeURIComponent(x.whatsappHref!)).toContain("Oi Maria, aqui é Clube Z")
  })
})
