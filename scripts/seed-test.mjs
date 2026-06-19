import Database from "better-sqlite3"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, "../prisma/dev.db")

const db = new Database(dbPath)

// ── 1. Campeonato de teste
const agora = new Date()
const ano = agora.getFullYear()

const campExistente = db.prepare("SELECT id FROM Campeonato WHERE nome = ? LIMIT 1")
  .get(`Copa Futsal Itaquerense ${ano}`)

let campId
if (campExistente) {
  campId = campExistente.id
  console.log(`Campeonato já existe (id=${campId})`)
} else {
  const r = db.prepare(`
    INSERT INTO Campeonato (nome, descricao, dataInicio, status, taxaInscricao, taxaJogo, taxaArbitragem, custoTransporte, custoUniforme, createdAt)
    VALUES (?, ?, ?, 'andamento', 0, 0, 0, 0, 0, ?)
  `).run(
    `Copa Futsal Itaquerense ${ano}`,
    `Campeonato de futsal Sub-11 e Sub-13 — temporada ${ano}`,
    new Date(`${ano}-03-01`).toISOString(),
    agora.toISOString(),
  )
  campId = r.lastInsertRowid
  console.log(`Campeonato criado (id=${campId})`)
}

// ── 2. Partidas de teste
const partidas = [
  {
    rodada: 1,
    data: new Date(`${ano}-03-10T15:00:00`).toISOString(),
    adversario: "E.C. Corinthians Sub-11",
    local: "Casa",
    golsPro: 3,
    golsContra: 1,
    resultado: "Vitoria",
  },
  {
    rodada: 2,
    data: new Date(`${ano}-03-24T14:00:00`).toISOString(),
    adversario: "Juventus F.C. Sub-11",
    local: "Fora",
    golsPro: 2,
    golsContra: 2,
    resultado: "Empate",
  },
  {
    rodada: 3,
    data: new Date(`${ano}-04-07T15:00:00`).toISOString(),
    adversario: "S.E. Palmeiras Sub-13",
    local: "Casa",
    golsPro: 1,
    golsContra: 3,
    resultado: "Derrota",
  },
  {
    rodada: 4,
    data: new Date(`${ano}-04-21T14:00:00`).toISOString(),
    adversario: "Sport Club Corinthians Paulista Sub-13",
    local: "Fora",
    golsPro: 4,
    golsContra: 0,
    resultado: "Vitoria",
  },
  {
    rodada: 5,
    // Próximo jogo — futuro
    data: new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    adversario: "A.A. Portuguesa Sub-11",
    local: "Casa",
    golsPro: null,
    golsContra: null,
    resultado: null,
  },
]

const insertPartida = db.prepare(`
  INSERT OR IGNORE INTO Partida (campeonatoId, rodada, data, adversario, local, golsPro, golsContra, resultado, fpfsJogoId, createdAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

let inseridos = 0
for (const p of partidas) {
  const chave = `test:${campId}:r${p.rodada}`
  const existe = db.prepare("SELECT id FROM Partida WHERE fpfsJogoId = ?").get(chave)
  if (existe) {
    console.log(`  Partida R${p.rodada} já existe`)
    continue
  }
  insertPartida.run(
    campId, p.rodada, p.data, p.adversario, p.local,
    p.golsPro, p.golsContra, p.resultado,
    chave,
    agora.toISOString(),
  )
  console.log(`  Partida R${p.rodada} inserida: ${p.adversario} (${p.resultado ?? "próximo"})`)
  inseridos++
}

console.log(`\nPronto. ${inseridos} partida(s) inserida(s). Campeonato id=${campId}`)
db.close()
