import fs from "fs"
import path from "path"

export type ClubConfig = {
  nome: string
  endereco: string
  telefone: string
  cidade: string
  metaMensal: number
  capacidadeTurma: number
  chavePix: string
  whatsapp: string
  googleCalendarId: string
  diaVencimento: number
  intervaloDiasLembreteInadimplencia: number
  // Templates de mensagem WhatsApp
  templateCobranca: string
  templateLembreteVencimento: string
  templateFalta: string
}

const CONFIG_PATH = path.join(process.cwd(), "club.config.json")

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

let cachedConfig: ClubConfig | null = null

export function getConfig(): ClubConfig {
  if (cachedConfig) return cachedConfig
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8")
    cachedConfig = { ...DEFAULT, ...JSON.parse(raw) }
    return cachedConfig as ClubConfig
  } catch {
    return DEFAULT
  }
}

export function saveConfig(config: ClubConfig) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8")
  cachedConfig = config
}
