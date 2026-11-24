import { describe, expect, it } from "vitest"
import {
  chaveDoNome,
  dataDeAmanha,
  decidirInscricao,
  eventoIcsDaJanela,
  formatarTelefone,
  instanteDaAula,
  janelaAberta,
  mensagemDaAula,
  montarPreMatricula,
  podeConverter,
  podeMudarStatus,
  primeiroCampoComErroAula,
  rotuloDia,
  taxaDeConversao,
  telefoneNormalizado,
  vagasDaJanela,
  validarAulaExperimental,
  validarJanela,
  type DadosAula,
} from "@/lib/aula-experimental"
import { montarCalendario } from "@/lib/icalendar"

const HOJE = new Date("2026-11-24T15:00:00-03:00")

const valido: DadosAula = {
  janelaId: 3,
  nomeAtleta: "Davi Souza",
  dataNascimento: "2016-05-10",
  nomeResponsavel: "Maria Souza",
  telefone: "(11) 99999-8888",
  email: "",
  consentimento: true,
}

describe("vagas da janela", () => {
  it("calcula restantes e rótulo", () => {
    expect(vagasDaJanela(10, 4)).toEqual({ restantes: 6, lotada: false, rotulo: "6 vagas" })
    expect(vagasDaJanela(10, 9)).toMatchObject({ restantes: 1, rotulo: "Última vaga" })
  })

  it("lotada quando ocupadas alcançam ou passam a capacidade", () => {
    expect(vagasDaJanela(5, 5)).toEqual({ restantes: 0, lotada: true, rotulo: "Lotada" })
    expect(vagasDaJanela(5, 8).lotada).toBe(true)
  })
})

describe("janela aberta e decisão de inscrição", () => {
  const janela = { data: "2026-11-28", hora: "09:00", ativa: true, capacidade: 2 }

  it("interpreta o horário no fuso de São Paulo", () => {
    expect(instanteDaAula(janela).toISOString()).toBe("2026-11-28T12:00:00.000Z")
  })

  it("aceita só com antecedência mínima e janela ativa", () => {
    expect(janelaAberta(janela, HOJE)).toBe(true)
    expect(janelaAberta({ ...janela, ativa: false }, HOJE)).toBe(false)
    expect(janelaAberta(janela, new Date("2026-11-28T11:00:00-03:00"))).toBe(false) // 1h antes
    expect(janelaAberta(janela, new Date("2026-11-29T10:00:00-03:00"))).toBe(false) // já passou
  })

  it("aceita enquanto há vaga", () => {
    expect(decidirInscricao({ janela, ocupadas: 1, jaTemAula: false, agora: HOJE })).toEqual({ ok: true })
  })

  it("recusa acima da capacidade", () => {
    expect(decidirInscricao({ janela, ocupadas: 2, jaTemAula: false, agora: HOJE })).toEqual({ ok: false, motivo: "lotada" })
  })

  it("recusa criança que já tem aula e janela indisponível", () => {
    expect(decidirInscricao({ janela, ocupadas: 0, jaTemAula: true, agora: HOJE })).toEqual({ ok: false, motivo: "ja-agendada" })
    expect(decidirInscricao({ janela: { ...janela, ativa: false }, ocupadas: 0, jaTemAula: false, agora: HOJE })).toEqual({
      ok: false,
      motivo: "indisponivel",
    })
  })
})

describe("validarAulaExperimental", () => {
  it("aceita dados completos, e-mail opcional", () => {
    expect(validarAulaExperimental(valido, HOJE)).toEqual({})
  })

  it("exige data, nome, responsável, telefone e consentimento", () => {
    const erros = validarAulaExperimental(
      { janelaId: null, nomeAtleta: " ", dataNascimento: "", nomeResponsavel: "", telefone: "", email: "", consentimento: false },
      HOJE,
    )
    expect(Object.keys(erros)).toEqual(["janela", "atleta", "dataNasc", "responsavel", "telefone", "consentimento"])
    expect(primeiroCampoComErroAula(erros)).toBe("janela")
  })

  it("valida telefone, e-mail e faixa de idade", () => {
    expect(validarAulaExperimental({ ...valido, telefone: "12345" }, HOJE).telefone).toMatch(/inválido/)
    expect(validarAulaExperimental({ ...valido, email: "sem-arroba" }, HOJE).email).toBe("E-mail inválido.")
    expect(validarAulaExperimental({ ...valido, dataNascimento: "2025-01-01" }, HOJE).dataNasc).toMatch(/3 a 20 anos/)
    expect(validarAulaExperimental({ ...valido, dataNascimento: "2016-02-31" }, HOJE).dataNasc).toMatch(/inválida/)
  })

  it("exige consentimento exatamente verdadeiro", () => {
    expect(validarAulaExperimental({ ...valido, consentimento: "sim" as unknown as boolean }, HOJE).consentimento).toBeTruthy()
  })
})

describe("validarJanela (admin)", () => {
  const base = { turma: "Sub-11", data: "2026-12-05", hora: "09:30", duracaoMin: 60, local: " Quadra 1 ", capacidade: 12 }

  it("normaliza e aceita", () => {
    expect(validarJanela(base, HOJE)).toEqual({
      ok: true,
      dados: { turma: "Sub-11", data: "2026-12-05", hora: "09:30", duracaoMin: 60, local: "Quadra 1", capacidade: 12 },
    })
  })

  it.each([
    [{ turma: "Sub-99" }, /turma/i],
    [{ data: "2026-13-01" }, /data válida/i],
    [{ data: "2026-11-01" }, /passado/i],
    [{ hora: "25:00" }, /HH:mm/],
    [{ duracaoMin: 5 }, /duração/i],
    [{ capacidade: 0 }, /capacidade/i],
    [{ capacidade: 61 }, /capacidade/i],
  ])("recusa %j", (parcial, mensagem) => {
    const r = validarJanela({ ...base, ...parcial }, HOJE)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.erro).toMatch(mensagem)
  })

  it("aceita a data de hoje", () => {
    expect(validarJanela({ ...base, data: "2026-11-24" }, HOJE).ok).toBe(true)
  })
})

describe("identidade e telefone", () => {
  it("compara nomes sem acento, caixa ou espaços repetidos", () => {
    expect(chaveDoNome("  João   da SILVA ")).toBe(chaveDoNome("joao da silva"))
  })

  it("normaliza telefone para dígitos sem DDI", () => {
    expect(telefoneNormalizado("(11) 99999-8888")).toBe("11999998888")
    expect(telefoneNormalizado("+55 11 99999-8888")).toBe("11999998888")
    expect(telefoneNormalizado("123")).toBe("")
  })

  it("formata telefone", () => {
    expect(formatarTelefone("11999998888")).toBe("(11) 99999-8888")
    expect(formatarTelefone("1133334444")).toBe("(11) 3333-4444")
  })
})

describe("status e conversão", () => {
  it("só a conversão marca convertida, e convertida não muda", () => {
    expect(podeMudarStatus("agendada", "compareceu")).toBe(true)
    expect(podeMudarStatus("faltou", "agendada")).toBe(true)
    expect(podeMudarStatus("agendada", "convertida")).toBe(false)
    expect(podeMudarStatus("convertida", "faltou")).toBe(false)
    expect(podeMudarStatus("agendada", "qualquer")).toBe(false)
  })

  it("converte uma vez e nunca cancelada", () => {
    expect(podeConverter({ status: "compareceu", preMatriculaId: null })).toBe(true)
    expect(podeConverter({ status: "convertida", preMatriculaId: 4 })).toBe(false)
    expect(podeConverter({ status: "cancelada", preMatriculaId: null })).toBe(false)
    expect(podeConverter({ status: "agendada", preMatriculaId: 4 })).toBe(false)
  })

  it("monta a pré-matrícula com os dados da inscrição", () => {
    const consentimentoEm = new Date("2026-11-20T12:00:00Z")
    const pre = montarPreMatricula(
      {
        nomeAtleta: "Davi Souza",
        dataNascimento: new Date("2016-05-10T12:00:00Z"),
        nomeResponsavel: "Maria Souza",
        telefone: "11999998888",
        email: null,
        consentimentoEm,
        consentimentoVersao: "2026-11-24",
      },
      { turma: "Sub-11", data: "2026-11-28", hora: "09:00" },
    )
    expect(pre).toMatchObject({
      nomeAluno: "Davi Souza",
      turma: "Sub-11",
      horario: "A combinar",
      nomeResponsavel: "Maria Souza",
      telefone: "(11) 99999-8888",
      email: "",
      status: "pendente",
      consentimentoEm,
      consentimentoVersao: "2026-11-24",
    })
    expect(pre.observacoes).toBe("Veio da aula experimental de 28/11/2026 às 09:00.")
  })

  it("calcula comparecimento e conversão sem dividir por zero", () => {
    expect(taxaDeConversao({ inscritas: 0, compareceram: 0, convertidas: 0 })).toEqual({ comparecimento: null, conversao: null })
    expect(taxaDeConversao({ inscritas: 10, compareceram: 4, convertidas: 2 })).toEqual({ comparecimento: 60, conversao: 20 })
  })
})

describe("datas e mensagens", () => {
  it("amanhã no fuso do clube, mesmo perto da meia-noite UTC", () => {
    expect(dataDeAmanha(new Date("2026-11-24T23:30:00-03:00"))).toBe("2026-11-25")
    expect(dataDeAmanha(new Date("2026-12-31T12:00:00-03:00"))).toBe("2027-01-01")
  })

  it("rotula o dia da semana", () => {
    expect(rotuloDia("2026-11-28")).toBe("sábado, 28/11")
  })

  it("preenche o modelo com primeiro nome, data, hora e local", () => {
    const texto = mensagemDaAula(
      { nomeAtleta: "Davi Souza", nomeResponsavel: "Maria Souza" },
      { turma: "Sub-11", data: "2026-11-28", hora: "09:00", local: null },
      "E.C. Itaquerense",
    )
    expect(texto).toContain("Olá, Maria!")
    expect(texto).toContain("aula experimental de Davi")
    expect(texto).toContain("sábado, 28/11, às 09:00")
    expect(texto).toContain("turma Sub-11")
    expect(texto).not.toMatch(/\{\w+\}/)
  })

  it("usa o modelo personalizado quando existe", () => {
    const texto = mensagemDaAula(
      { nomeAtleta: "Davi", nomeResponsavel: "Maria" },
      { turma: "Sub-11", data: "2026-11-28", hora: "09:00", local: "Quadra 1" },
      "Clube",
      { experimental: "Oi {responsavel}, {aluno} treina {hora} em {local}" },
    )
    expect(texto).toBe("Oi Maria, Davi treina 09:00 em Quadra 1")
  })
})

describe("evento .ics", () => {
  const janela = { id: 7, turma: "Sub-11", data: "2026-11-28", hora: "09:00", duracaoMin: 90, local: "Quadra 1" }

  it("gera um evento com fuso, duração e UID estável, sem dados de criança", () => {
    const ics = montarCalendario([eventoIcsDaJanela(janela, "E.C. Itaquerense")], { nome: "Aula", metodo: "PUBLISH", agora: HOJE })
    expect(ics).toContain("UID:aula-experimental-7@itaquerense")
    expect(ics).toContain("DTSTART;TZID=America/Sao_Paulo:20261128T090000")
    expect(ics).toContain("DTEND;TZID=America/Sao_Paulo:20261128T103000")
    expect(ics).toContain("LOCATION:Quadra 1")
    expect(ics).toContain("METHOD:PUBLISH")
    expect(ics).toMatch(/SUMMARY:Aula experimental/)
  })
})
