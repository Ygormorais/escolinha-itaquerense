import { describe, it, expect } from "vitest"
import { montarMensagemFalta } from "@/lib/whatsapp-jobs"

describe("montarMensagemFalta", () => {
  it("mensagem de Ausente contém 'falta' e o nome", () => {
    const msg = montarMensagemFalta("João Silva", "18/06/2026", "Ausente")
    expect(msg).toContain("João Silva")
    expect(msg.toLowerCase()).toContain("falta")
    expect(msg).toContain("18/06/2026")
  })
  it("mensagem de Justificado contém 'justificada'", () => {
    const msg = montarMensagemFalta("Maria Souza", "18/06/2026", "Justificado")
    expect(msg).toContain("Maria Souza")
    expect(msg.toLowerCase()).toContain("justificada")
  })
  it("textos de Ausente e Justificado são diferentes", () => {
    const a = montarMensagemFalta("X", "01/01/2026", "Ausente")
    const j = montarMensagemFalta("X", "01/01/2026", "Justificado")
    expect(a).not.toBe(j)
  })
})
