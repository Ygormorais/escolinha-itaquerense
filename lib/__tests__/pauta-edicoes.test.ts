import { describe, expect, it } from "vitest"
import { pautaEstaSalva, pautaTemEdicoesPendentes } from "@/lib/pauta-edicoes"

const rascunho = { turma: "Sub-13", cicloInicio: "2026-08-31", texto: "Pauta original\nPlano da comissão" }
const salvo = { ...rascunho, texto: "Pauta revisada e salva" }

describe("alterações não salvas da pauta", () => {
  it("não avisa antes de preparar nem para a geração intacta", () => {
    expect(pautaTemEdicoesPendentes(null, "", null)).toBe(false)
    expect(pautaTemEdicoesPendentes(rascunho, rascunho.texto, null)).toBe(false)
    expect(pautaEstaSalva(null, salvo.texto, salvo)).toBe(false)
  })

  it("detecta edição, inclusive apagar todo o texto", () => {
    expect(pautaTemEdicoesPendentes(rascunho, "Texto editado", null)).toBe(true)
    expect(pautaTemEdicoesPendentes(rascunho, "", null)).toBe(true)
  })

  it("remove o aviso ao desfazer alterações não salvas", () => {
    expect(pautaTemEdicoesPendentes(rascunho, rascunho.texto, null)).toBe(false)
  })

  it("usa a última versão salva como referência após salvar", () => {
    expect(pautaTemEdicoesPendentes(rascunho, salvo.texto, salvo)).toBe(false)
    expect(pautaEstaSalva(rascunho, salvo.texto, salvo)).toBe(true)
    expect(pautaTemEdicoesPendentes(rascunho, rascunho.texto, salvo)).toBe(true)
    expect(pautaEstaSalva(rascunho, rascunho.texto, salvo)).toBe(false)
  })

  it.each([{ turma: "Sub-15" }, { cicloInicio: "2026-09-07" }])("não considera uma versão salva de outro contexto: %j", (change) => {
    const outro = { ...salvo, ...change }
    expect(pautaTemEdicoesPendentes(rascunho, salvo.texto, outro)).toBe(true)
    expect(pautaEstaSalva(rascunho, salvo.texto, outro)).toBe(false)
  })

  it("normaliza bordas e quebras como o servidor, sem ignorar espaços internos", () => {
    expect(pautaTemEdicoesPendentes(rascunho, ` ${rascunho.texto.replaceAll("\n", "\r\n")} `, null)).toBe(false)
    expect(pautaEstaSalva(rascunho, ` ${salvo.texto} `, salvo)).toBe(true)
    expect(pautaTemEdicoesPendentes(rascunho, rascunho.texto.replace("Plano da", "Plano  da"), null)).toBe(true)
  })

  it("funciona para registros sem turma", () => {
    const semTurma = { ...rascunho, turma: "" }
    expect(pautaEstaSalva(semTurma, semTurma.texto, semTurma)).toBe(true)
    expect(pautaTemEdicoesPendentes(semTurma, "Alterado", semTurma)).toBe(true)
  })
})
