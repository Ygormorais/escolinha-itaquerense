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

export function resolveClubConfigPath(): string {
  const configuredPath = process.env.CLUB_CONFIG_PATH?.trim()
  return configuredPath
    ? path.resolve(configuredPath)
    : path.join(process.cwd(), "club.config.json")
}

export const DEFAULT: ClubConfig = {
  nome: "E.C. Itaquerense",
  endereco: "R. Augusto Carlos Baumann, 588",
  telefone: "",
  cidade: "Itaquera — São Paulo/SP",
  metaMensal: 0,
  capacidadeTurma: 20,
  chavePix: "ygorcamisa1@gmail.com",
  whatsapp: "5511958686579",
  googleCalendarId: "",
  diaVencimento: 10,
  intervaloDiasLembreteInadimplencia: 7,
  templateCobranca: "Olá {responsavel}!\n\nLembrete: mensalidades de *{aluno}* em atraso:\n\n{meses}\n\nTotal: *{total}*\n{pix}\n\nQualquer dúvida, entre em contato.",
  templateLembreteVencimento: "Olá {responsavel}! Lembrete: a mensalidade de *{aluno}* vence em *{data}*.\n\nValor: *{valor}*{pix}\n\nObrigado!",
  templateFalta: "Olá {responsavel}! Registramos a *falta* de *{aluno}* no treino do dia {data}.\n\nQualquer dúvida, entre em contato.",
}

let cachedConfig: ClubConfig | null = null

// Só para testes: o cache em memória persiste entre casos do mesmo arquivo.
export function resetConfigCache() {
  cachedConfig = null
}

export function getConfig(): ClubConfig {
  if (cachedConfig) return cachedConfig
  try {
    const raw = fs.readFileSync(resolveClubConfigPath(), "utf-8")
    cachedConfig = { ...DEFAULT, ...JSON.parse(raw) }
    return cachedConfig as ClubConfig
  } catch {
    return DEFAULT
  }
}

export function saveConfig(config: ClubConfig) {
  const configPath = resolveClubConfigPath()
  const configDir = path.dirname(configPath)
  fs.mkdirSync(configDir, { recursive: true, mode: 0o700 })
  fs.chmodSync(configDir, 0o700)
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), { encoding: "utf-8", mode: 0o600 })
  fs.chmodSync(configPath, 0o600)
  cachedConfig = config
}
