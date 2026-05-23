import fs from "fs"
import path from "path"

export type ClubConfig = {
  nome: string
  endereco: string
  telefone: string
  cidade: string
}

const CONFIG_PATH = path.join(process.cwd(), "club.config.json")

const DEFAULT: ClubConfig = {
  nome: "E.C. Itaquerense",
  endereco: "Rua das Palmeiras, 123 — Vila Futebol",
  telefone: "",
  cidade: "São Paulo/SP",
}

export function getConfig(): ClubConfig {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8")
    return { ...DEFAULT, ...JSON.parse(raw) }
  } catch {
    return DEFAULT
  }
}

export function saveConfig(config: ClubConfig) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8")
}
