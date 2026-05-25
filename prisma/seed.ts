import { PrismaClient } from "@prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import { fakerPT_BR as faker } from "@faker-js/faker"
import path from "path"

const dbPath = path.join(process.cwd(), "prisma", "dev.db")
const adapter = new PrismaBetterSqlite3({ url: dbPath })
const db = new PrismaClient({ adapter } as any)

const HORARIOS = [
  "Seg/Qua 08h", "Seg/Qua 10h", "Seg/Qua 14h",
  "Ter/Qui 08h", "Ter/Qui 10h", "Ter/Qui 14h",
] as const

const FORMAS = ["PIX", "PIX", "PIX", "Dinheiro", "Dinheiro", "Transferência", "Cartão"] as const

const TURMA_FAIXA: Record<string, [number, number]> = {
  "Sub-7":  [5, 7],
  "Sub-9":  [8, 9],
  "Sub-11": [10, 11],
  "Sub-13": [12, 13],
  "Sub-15": [14, 15],
  "Sub-17": [16, 17],
}

const TURMA_MENSALIDADE: Record<string, number> = {
  "Sub-7":  150,
  "Sub-9":  150,
  "Sub-11": 200,
  "Sub-13": 200,
  "Sub-15": 250,
  "Sub-17": 250,
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function getLastNMonths(n: number): string[] {
  const now = new Date()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  })
}

function getTrainingDates(horario: string): Date[] {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - 3, 1)
  const isSegQua = horario.startsWith("Seg/Qua")
  const dates: Date[] = []
  const d = new Date(start)
  while (d <= now) {
    const dow = d.getDay()
    if (isSegQua && (dow === 1 || dow === 3)) dates.push(new Date(d))
    else if (!isSegQua && (dow === 2 || dow === 4)) dates.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return dates
}

const DISTRIBUICAO = [
  { turma: "Sub-7",  ativos: 30, inativos: 3 },
  { turma: "Sub-9",  ativos: 31, inativos: 3 },
  { turma: "Sub-11", ativos: 31, inativos: 2 },
  { turma: "Sub-13", ativos: 31, inativos: 3 },
  { turma: "Sub-15", ativos: 31, inativos: 2 },
  { turma: "Sub-17", ativos: 31, inativos: 2 },
]

async function main() {
  console.log("🌱 Iniciando seed com 200 alunos realistas...")

  await db.frequencia.deleteMany()
  await db.pagamento.deleteMany()
  await db.uniforme.deleteMany()
  await db.custo.deleteMany()
  await db.aluno.deleteMany()
  await db.custoRecorrente.deleteMany()
  await db.configuracao.deleteMany()
  console.log("🗑️  Tabelas limpas")

  const comDesconto = new Set<number>()
  while (comDesconto.size < 20) comDesconto.add(randInt(0, 199))

  const alunosPayload: any[] = []
  let idx = 0

  for (const { turma, ativos, inativos } of DISTRIBUICAO) {
    const [minAge, maxAge] = TURMA_FAIXA[turma]
    const mensalidade = TURMA_MENSALIDADE[turma]

    for (let i = 0; i < ativos + inativos; i++) {
      const ageYears = randInt(minAge, maxAge)
      const birthYear = new Date().getFullYear() - ageYears
      const dataNascimento = new Date(birthYear, randInt(0, 11), randInt(1, 28))
      const dataMatricula = faker.date.between({
        from: new Date("2024-01-01"),
        to: new Date("2026-01-01"),
      })
      const desconto = comDesconto.has(idx) ? randInt(3, 5) * 10 : 0

      alunosPayload.push({
        nome: faker.person.fullName({ sex: "male" }),
        dataNascimento,
        turma,
        horario: pick(HORARIOS),
        responsavel: faker.person.fullName(),
        telefone: `(11) 9${randInt(1000, 9999)}-${randInt(1000, 9999)}`,
        email: faker.internet.email().toLowerCase(),
        dataMatricula,
        mensalidade,
        desconto,
        status: i < ativos ? "Ativo" : "Inativo",
        observacoes: Math.random() < 0.1 ? faker.lorem.sentence() : null,
      })
      idx++
    }
  }

  await db.aluno.createMany({ data: alunosPayload })
  const alunos = await db.aluno.findMany({ orderBy: { id: "asc" } })
  console.log(`✅ ${alunos.length} alunos inseridos`)

  const meses = getLastNMonths(6)
  const ativos = alunos.filter(a => a.status === "Ativo")

  const cenarios = ativos.map(() => {
    const r = Math.random()
    if (r < 0.75) return "adimplente"
    if (r < 0.90) return "inadimplente"
    return "pendente"
  })

  const pagamentosPayload: any[] = []

  for (let ai = 0; ai < ativos.length; ai++) {
    const aluno = ativos[ai]
    const cenario = cenarios[ai]
    const valorBase = aluno.mensalidade - aluno.desconto

    const inadimplenteMeses = new Set<string>()
    if (cenario === "inadimplente") {
      const numAtrasados = randInt(1, 3)
      const mesesPassados = meses.slice(0, -1)
      for (let i = 0; i < numAtrasados && i < mesesPassados.length; i++) {
        inadimplenteMeses.add(mesesPassados[randInt(0, mesesPassados.length - 1)])
      }
    }

    for (const mes of meses) {
      const [year, month] = mes.split("-").map(Number)
      const vencimento = new Date(year, month - 1, 10)
      const isMesAtual = mes === meses[meses.length - 1]
      const isPendente = isMesAtual && cenario === "pendente"
      const isAtrasado = inadimplenteMeses.has(mes)

      let dataPagamento: Date | null = null
      let formaPagamento: string | null = null
      let valorRecebido: number | null = null

      if (!isPendente && !isAtrasado) {
        dataPagamento = new Date(year, month - 1, randInt(1, 20))
        formaPagamento = pick(FORMAS)
        valorRecebido = valorBase
      }

      pagamentosPayload.push({
        alunoId: aluno.id,
        mesReferencia: mes,
        dataVencimento: vencimento,
        dataPagamento,
        formaPagamento,
        valorRecebido,
      })
    }
  }

  await db.pagamento.createMany({ data: pagamentosPayload })
  console.log(`✅ ${pagamentosPayload.length} pagamentos inseridos`)

  const freqPayload: any[] = []

  for (const aluno of ativos) {
    const taxa = 0.60 + Math.random() * 0.35
    const datas = getTrainingDates(aluno.horario)
    for (const data of datas) {
      freqPayload.push({
        alunoId: aluno.id,
        data,
        presenca: Math.random() < taxa ? "Presente" : "Ausente",
      })
    }
  }

  const CHUNK = 500
  for (let i = 0; i < freqPayload.length; i += CHUNK) {
    await db.frequencia.createMany({
      data: freqPayload.slice(i, i + CHUNK),
    })
  }
  console.log(`✅ ${freqPayload.length} registros de frequência inseridos`)

  await db.configuracao.createMany({
    data: [
      { chave: "metaMensal",      valor: "30000" },
      { chave: "capacidadeTurma", valor: "35" },
      { chave: "nomeEscola",      valor: "Escolinha Itaquerense" },
    ],
  })
  console.log("✅ Configurações padrão criadas")
  console.log("🎉 Seed concluído!")
}

main().catch(console.error).finally(() => db.$disconnect())
