import fs from "fs"
import os from "os"
import path from "path"
import Database from "better-sqlite3"
import { afterEach, describe, expect, it } from "vitest"
import {
  createBackupBundle,
  restoreBackupBundle,
  validateBackupBundle,
} from "../backup-bundle"

const temporarios: string[] = []

function ambiente() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "escolinha-backup-test-"))
  temporarios.push(root)
  const dbPath = path.join(root, "data", "prod.db")
  const uploadsDir = path.join(root, "data", "uploads")
  const configPath = path.join(root, "data", "config", "club.config.json")
  const backupDir = path.join(root, "backups")
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  const db = new Database(dbPath)
  db.exec("CREATE TABLE item (id INTEGER PRIMARY KEY, nome TEXT NOT NULL); INSERT INTO item (nome) VALUES ('original')")
  db.close()
  fs.mkdirSync(path.join(uploadsDir, "matriculas"), { recursive: true })
  fs.writeFileSync(path.join(uploadsDir, "matriculas", "documento.pdf"), "documento original")
  fs.mkdirSync(path.dirname(configPath), { recursive: true })
  fs.writeFileSync(configPath, JSON.stringify({ nome: "Clube original" }))
  return { root, dbPath, uploadsDir, configPath, backupDir }
}

afterEach(() => {
  for (const dir of temporarios.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})

describe("backup completo", () => {
  it("salva e restaura banco, uploads e configuração", async () => {
    const locais = ambiente()
    const bundle = await createBackupBundle({
      ...locais,
      prefix: "prod",
      now: new Date("2026-08-11T12:00:00.000Z"),
    })

    const manifest = validateBackupBundle(bundle)
    expect(manifest.files.map((file) => file.path)).toEqual([
      "config/club.config.json",
      "database.db",
      "uploads/matriculas/documento.pdf",
    ])

    const db = new Database(locais.dbPath)
    db.prepare("UPDATE item SET nome = ? WHERE id = 1").run("alterado")
    db.close()
    fs.writeFileSync(path.join(locais.uploadsDir, "matriculas", "documento.pdf"), "alterado")
    fs.writeFileSync(path.join(locais.uploadsDir, "arquivo-extra.txt"), "extra")
    fs.writeFileSync(locais.configPath, JSON.stringify({ nome: "Alterado" }))

    restoreBackupBundle(bundle, locais)

    const restaurado = new Database(locais.dbPath, { readonly: true })
    expect(restaurado.prepare("SELECT nome FROM item WHERE id = 1").pluck().get()).toBe("original")
    restaurado.close()
    expect(fs.readFileSync(path.join(locais.uploadsDir, "matriculas", "documento.pdf"), "utf8"))
      .toBe("documento original")
    expect(fs.existsSync(path.join(locais.uploadsDir, "arquivo-extra.txt"))).toBe(false)
    expect(JSON.parse(fs.readFileSync(locais.configPath, "utf8"))).toEqual({ nome: "Clube original" })
  })

  it("recusa um pacote alterado depois da criação", async () => {
    const locais = ambiente()
    const bundle = await createBackupBundle({ ...locais, prefix: "prod" })
    fs.appendFileSync(path.join(bundle, "uploads", "matriculas", "documento.pdf"), "adulterado")
    expect(() => validateBackupBundle(bundle)).toThrow("Integridade divergente")
  })

  it("representa uploads e configuração ausentes sem herdar dados antigos", async () => {
    const locais = ambiente()
    fs.rmSync(locais.uploadsDir, { recursive: true })
    fs.unlinkSync(locais.configPath)
    const bundle = await createBackupBundle({ ...locais, prefix: "prod" })

    fs.mkdirSync(locais.uploadsDir, { recursive: true })
    fs.writeFileSync(path.join(locais.uploadsDir, "antigo.txt"), "antigo")
    fs.writeFileSync(locais.configPath, "{}")
    restoreBackupBundle(bundle, locais)

    expect(fs.readdirSync(locais.uploadsDir)).toEqual([])
    expect(fs.existsSync(locais.configPath)).toBe(false)
  })
})
