import { describe, expect, it } from "vitest"
import { resumoEstaSalvo, resumoTemEdicoesPendentes } from "@/lib/resumo-edicoes"

const resumo = { mes: "2026-08", texto: "Resumo original\nAcompanhamento" }
const salvo = { mes: "2026-08", texto: "Resumo revisado pela comissão" }

describe("edições do resumo familiar", () => {
  it("não avisa sem rascunho nem para a geração intacta", () => {
    expect(resumoTemEdicoesPendentes(null, "", null)).toBe(false)
    expect(resumoTemEdicoesPendentes(resumo, resumo.texto, null)).toBe(false)
    expect(resumoEstaSalvo(null, salvo.texto, salvo)).toBe(false)
  })
  it("detecta edição e exclusão completa do texto", () => {
    expect(resumoTemEdicoesPendentes(resumo, "Editado", null)).toBe(true)
    expect(resumoTemEdicoesPendentes(resumo, "", null)).toBe(true)
  })
  it("ignora apenas espaços nas bordas, como o salvamento", () => {
    expect(resumoTemEdicoesPendentes(resumo, ` ${resumo.texto} `, null)).toBe(false)
    expect(resumoEstaSalvo(resumo, ` ${salvo.texto} `, salvo)).toBe(true)
    expect(resumoTemEdicoesPendentes(resumo, resumo.texto.replace("\n", "\r\n"), null)).toBe(true)
  })
  it("remove o aviso ao desfazer uma edição", () => {
    expect(resumoTemEdicoesPendentes(resumo, resumo.texto, null)).toBe(false)
  })
  it("usa a última gravação como referência, não o texto gerado", () => {
    expect(resumoEstaSalvo(resumo, salvo.texto, salvo)).toBe(true)
    expect(resumoTemEdicoesPendentes(resumo, salvo.texto, salvo)).toBe(false)
    expect(resumoTemEdicoesPendentes(resumo, resumo.texto, salvo)).toBe(true)
  })
  it("não confunde uma versão salva de outro mês", () => {
    const outro = { ...salvo, mes: "2026-07" }
    expect(resumoEstaSalvo(resumo, salvo.texto, outro)).toBe(false)
    expect(resumoTemEdicoesPendentes(resumo, salvo.texto, outro)).toBe(true)
    expect(resumoTemEdicoesPendentes(resumo, resumo.texto, outro)).toBe(false)
  })
})
