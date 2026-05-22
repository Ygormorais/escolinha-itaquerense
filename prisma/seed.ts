import { PrismaClient } from "@prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import path from "path"
import { alunosData, custosData } from "../lib/seed-data"

const dbPath = path.join(process.cwd(), "prisma", "dev.db")
const adapter = new PrismaBetterSqlite3({ url: dbPath })
const db = new PrismaClient({ adapter } as any)

async function main() {
  console.log("🌱 Iniciando seed...")

  await db.frequencia.deleteMany()
  await db.pagamento.deleteMany()
  await db.custo.deleteMany()
  await db.aluno.deleteMany()

  // Insert alunos
  for (const aluno of alunosData) {
    await db.aluno.create({ data: aluno })
  }
  console.log(`✅ ${alunosData.length} alunos inseridos`)

  // Insert custos
  await db.custo.createMany({ data: custosData })
  console.log(`✅ ${custosData.length} custos inseridos`)

  // Fetch aluno IDs
  const alunos = await db.aluno.findMany({ orderBy: { id: "asc" } })
  const [lucas, gabriel, matheus, pedro, joao, felipe, arthur, bruno] = alunos

  // Insert pagamentos
  const pagamentos = [
    { alunoId: lucas.id,   mesReferencia: "2025-01", dataVencimento: new Date("2025-01-10"), dataPagamento: new Date("2025-01-08"),  formaPagamento: "PIX",           valorRecebido: 150 },
    { alunoId: gabriel.id, mesReferencia: "2025-01", dataVencimento: new Date("2025-01-10"), dataPagamento: new Date("2025-01-15"),  formaPagamento: "Dinheiro",      valorRecebido: 180 },
    { alunoId: matheus.id, mesReferencia: "2025-01", dataVencimento: new Date("2025-01-10"), dataPagamento: new Date("2025-01-10"),  formaPagamento: "Transferência", valorRecebido: 200 },
    { alunoId: pedro.id,   mesReferencia: "2025-01", dataVencimento: new Date("2025-01-10"), dataPagamento: new Date("2025-01-20"),  formaPagamento: "PIX",           valorRecebido: 220 },
    { alunoId: joao.id,    mesReferencia: "2025-02", dataVencimento: new Date("2025-02-10"), dataPagamento: new Date("2025-02-12"),  formaPagamento: "Cartão",        valorRecebido: 250 },
    { alunoId: felipe.id,  mesReferencia: "2025-02", dataVencimento: new Date("2025-02-10"), dataPagamento: new Date("2025-02-09"),  formaPagamento: "PIX",           valorRecebido: 230 },
    { alunoId: lucas.id,   mesReferencia: "2025-02", dataVencimento: new Date("2025-02-10"), dataPagamento: null, formaPagamento: null, valorRecebido: null },
    { alunoId: gabriel.id, mesReferencia: "2025-03", dataVencimento: new Date("2025-03-10"), dataPagamento: null, formaPagamento: null, valorRecebido: null },
    { alunoId: matheus.id, mesReferencia: "2025-03", dataVencimento: new Date("2025-03-10"), dataPagamento: new Date("2025-03-25"),  formaPagamento: "PIX",           valorRecebido: 200 },
    { alunoId: pedro.id,   mesReferencia: "2025-03", dataVencimento: new Date("2025-03-10"), dataPagamento: null, formaPagamento: null, valorRecebido: null },
    { alunoId: joao.id,    mesReferencia: "2025-04", dataVencimento: new Date("2025-04-10"), dataPagamento: new Date("2025-04-10"),  formaPagamento: "Dinheiro",      valorRecebido: 250 },
    { alunoId: bruno.id,   mesReferencia: "2025-04", dataVencimento: new Date("2025-04-10"), dataPagamento: null, formaPagamento: null, valorRecebido: null },
  ]
  await db.pagamento.createMany({ data: pagamentos })
  console.log(`✅ ${pagamentos.length} pagamentos inseridos`)

  // Insert frequencias
  const datas = ["2025-03-03","2025-03-05","2025-03-10","2025-03-12","2025-03-17","2025-03-19","2025-03-24","2025-03-26"]
  const presencas: [number, string[]][] = [
    [lucas.id,   ["Presente","Presente","Ausente","Presente","Presente","Presente","Justificado","Presente"]],
    [gabriel.id, ["Presente","Presente","Presente","Presente","Ausente","Presente","Presente","Presente"]],
    [matheus.id, ["Presente","Ausente","Presente","Presente","Presente","Presente","Presente","Ausente"]],
    [pedro.id,   ["Presente","Presente","Presente","Ausente","Presente","Presente","Presente","Presente"]],
    [joao.id,    ["Ausente","Presente","Presente","Presente","Presente","Ausente","Presente","Presente"]],
    [felipe.id,  ["Presente","Presente","Ausente","Presente","Presente","Presente","Presente","Presente"]],
    [arthur.id,  ["Ausente","Ausente","Ausente","Ausente","Ausente","Ausente","Ausente","Ausente"]],
    [bruno.id,   ["Presente","Presente","Presente","Presente","Justificado","Presente","Presente","Presente"]],
  ]
  for (const [alunoId, ps] of presencas) {
    for (let i = 0; i < datas.length; i++) {
      await db.frequencia.create({ data: { alunoId, data: new Date(datas[i]), presenca: ps[i] } })
    }
  }
  console.log("✅ Frequências inseridas")
  console.log("🎉 Seed concluído!")
}

main().catch(console.error).finally(() => db.$disconnect())
