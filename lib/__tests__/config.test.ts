import { describe, it, expect, beforeEach, afterEach } from "vitest"
import fs from "fs"
import path from "path"
import { getConfig, saveConfig, type ClubConfig } from "../config"

const TEST_CONFIG_PATH = path.join(process.cwd(), "club.config.json")
const DEFAULT: ClubConfig = {
  nome: "E.C. Itaquerense",
  endereco: "Rua das Palmeiras, 123 — Vila Futebol",
  telefone: "",
  cidade: "São Paulo/SP",
  metaMensal: 0,
  capacidadeTurma: 20,
  chavePix: "ygorcamisa1@gmail.com",
  whatsapp: "5511999999999",
  googleCalendarId: "",
  diaVencimento: 10,
  intervaloDiasLembreteInadimplencia: 7,
  templateCobranca: "Olá {responsavel}!\n\nLembrete: mensalidades de *{aluno}* em atraso:\n\n{meses}\n\nTotal: *{total}*\n{pix}\n\nQualquer dúvida, entre em contato.",
  templateLembreteVencimento: "Olá {responsavel}! Lembrete: a mensalidade de *{aluno}* vence em *{data}*.\n\nValor: *{valor}*{pix}\n\nObrigado!",
  templateFalta: "Olá {responsavel}! Registramos a *falta* de *{aluno}* no treino do dia {data}.\n\nQualquer dúvida, entre em contato.",
}

describe("lib/config", () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_CONFIG_PATH)) {
      fs.unlinkSync(TEST_CONFIG_PATH)
    }
  })

  afterEach(() => {
    if (fs.existsSync(TEST_CONFIG_PATH)) {
      fs.unlinkSync(TEST_CONFIG_PATH)
    }
  })

  it("returns DEFAULT when no config file exists", () => {
    const config = getConfig()
    expect(config).toEqual(DEFAULT)
  })

  it("saves and retrieves config", () => {
    saveConfig({ ...DEFAULT, nome: "Teste FC" })
    const config = getConfig()
    expect(config.nome).toBe("Teste FC")
  })

  it("persists whatsapp field", () => {
    saveConfig({ ...DEFAULT, whatsapp: "5511888888888" })
    const config = getConfig()
    expect(config.whatsapp).toBe("5511888888888")
  })

  it("preserves DEFAULT fields when config is partial", () => {
    fs.writeFileSync(TEST_CONFIG_PATH, JSON.stringify({ nome: "Custom" }))
    const config = getConfig()
    expect(config.nome).toBe("Custom")
    expect(config.whatsapp).toBe(DEFAULT.whatsapp)
    expect(config.capacidadeTurma).toBe(DEFAULT.capacidadeTurma)
  })
})
