import { describe, expect, it } from "vitest"
import {
  MODELOS_MENSAGEM,
  normalizarTelefoneBR,
  preencherModelo,
  textoDoModelo,
  variaveisDoModelo,
  whatsappHrefPara,
} from "@/lib/whatsapp-modelos"

describe("modelos de mensagem", () => {
  it("tem os cinco modelos esperados com texto em português", () => {
    expect(MODELOS_MENSAGEM.map((m) => m.id)).toEqual(["cobranca", "convocacao", "chuva", "vaga", "atencao", "satisfacao"])
  })

  it("lista variáveis sem repetir", () => {
    expect(variaveisDoModelo("Oi {aluno}, {aluno} e {data}")).toEqual(["aluno", "data"])
  })

  it("preenche variáveis e mantém visível a que ficou sem valor", () => {
    expect(preencherModelo("Olá {responsavel}, {aluno} em {data}", { responsavel: " Ana ", aluno: "Davi", data: "" }))
      .toBe("Olá Ana, Davi em {data}")
  })

  it("usa o texto personalizado só quando não está vazio", () => {
    expect(textoDoModelo("chuva", { chuva: "  Sem treino hoje {data}  " })).toBe("Sem treino hoje {data}")
    expect(textoDoModelo("chuva", { chuva: "   " })).toContain("chuva")
    expect(textoDoModelo("chuva")).toContain("{turma}")
  })
})

describe("telefone e link do WhatsApp", () => {
  it.each([
    ["(11) 95868-6579", "5511958686579"],
    ["11 3333-4444", "551133334444"],
    ["+55 11 95868-6579", "5511958686579"],
    ["5511958686579", "5511958686579"],
  ])("normaliza %s", (entrada, saida) => expect(normalizarTelefoneBR(entrada)).toBe(saida))

  it.each(["", "123", "abc", null, undefined, "999999999"])("rejeita %s", (t) => expect(normalizarTelefoneBR(t)).toBeNull())

  it("monta o link wa.me com a mensagem codificada", () => {
    const href = whatsappHrefPara("(11) 95868-6579", "Olá & tudo bem?")
    expect(href).toBe("https://wa.me/5511958686579?text=Ol%C3%A1%20%26%20tudo%20bem%3F")
  })

  it("não cai no número padrão do clube quando o telefone é inválido", () => {
    expect(whatsappHrefPara("sem telefone", "oi")).toBeNull()
  })
})
