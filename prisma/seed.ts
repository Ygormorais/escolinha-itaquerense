import { PrismaClient } from "@prisma/client"
import { alunosData, custosData } from "../lib/seed-data"

const db = new PrismaClient()

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
    { alunoId: lucas.id,   mesReferencia: "Janeiro/2025",   dataVencimento: new Date("2025-01-10"), dataPagamento: new Date("2025-01-08"),  formaPagamento: "PIX",           valorRecebido: 150 },
    { alunoId: gabriel.id, mesReferencia: "Janeiro/2025",   dataVencimento: new Date("2025-01-10"), dataPagamento: new Date("2025-01-15"),  formaPagamento: "Dinheiro",      valorRecebido: 180 },
    { alunoId: matheus.id, mesReferencia: "Janeiro/2025",   dataVencimento: new Date("2025-01-10"), dataPagamento: new Date("2025-01-10"),  formaPagamento: "Transferência", valorRecebido: 200 },
    { alunoId: pedro.id,   mesReferencia: "Janeiro/2025",   dataVencimento: new Date("2025-01-10"), dataPagamento: new Date("2025-01-20"),  formaPagamento: "PIX",           valorRecebido: 220 },
    { alunoId: joao.id,    mesReferencia: "Fevereiro/2025", dataVencimento: new Date("2025-02-10"), dataPagamento: new Date("2025-02-12"),  formaPagamento: "Cartão",        valorRecebido: 250 },
    { alunoId: felipe.id,  mesReferencia: "Fevereiro/2025", dataVencimento: new Date("2025-02-10"), dataPagamento: new Date("2025-02-09"),  formaPagamento: "PIX",           valorRecebido: 230 },
    { alunoId: lucas.id,   mesReferencia: "Fevereiro/2025", dataVencimento: new Date("2025-02-10"), dataPagamento: null, formaPagamento: null, valorRecebido: null },
    { alunoId: gabriel.id, mesReferencia: "Março/2025",     dataVencimento: new Date("2025-03-10"), dataPagamento: null, formaPagamento: null, valorRecebido: null },
    { alunoId: matheus.id, mesReferencia: "Março/2025",     dataVencimento: new Date("2025-03-10"), dataPagamento: new Date("2025-03-25"),  formaPagamento: "PIX",           valorRecebido: 200 },
    { alunoId: pedro.id,   mesReferencia: "Março/2025",     dataVencimento: new Date("2025-03-10"), dataPagamento: null, formaPagamento: null, valorRecebido: null },
    { alunoId: joao.id,    mesReferencia: "Abril/2025",     dataVencimento: new Date("2025-04-10"), dataPagamento: new Date("2025-04-10"),  formaPagamento: "Dinheiro",      valorRecebido: 250 },
    { alunoId: bruno.id,   mesReferencia: "Abril/2025",     dataVencimento: new Date("2025-04-10"), dataPagamento: null, formaPagamento: null, valorRecebido: null },
  ]
  await db.pagamento.createMany({ data: pagamentos })
  console.log(`✅ ${pagamentos.length} pagamentos inseridos`)

  // Insert frequencias
  const datas = ["2025-03-03","2025-03-05","2025-03-10","2025-03-12","2025-03-17","2025-03-19","2025-03-24","2025-03-26"]
  const presencas: [number, string[]][] = [
    [lucas.id,   ["P","P","F","P","P","P","J","P"]],
    [gabriel.id, ["P","P","P","P","F","P","P","P"]],
    [matheus.id, ["P","F","P","P","P","P","P","F"]],
    [pedro.id,   ["P","P","P","F","P","P","P","P"]],
    [joao.id,    ["F","P","P","P","P","F","P","P"]],
    [felipe.id,  ["P","P","F","P","P","P","P","P"]],
    [arthur.id,  ["F","F","F","F","F","F","F","F"]],
    [bruno.id,   ["P","P","P","P","J","P","P","P"]],
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
