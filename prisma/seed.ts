import { alunosData, custosData } from "../lib/seed-data"
import { db } from "../lib/db"

if (process.env.NODE_ENV === "production") {
  console.error("❌ seed.ts não deve ser executado em produção! Abortando.")
  process.exit(1)
}

/** Gera um CPF válido (apenas dígitos) para dados de teste. */
function geraCpf(): string {
  const n = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10))
  const dig = (arr: number[]) => {
    let s = 0
    for (let i = 0; i < arr.length; i++) s += arr[i] * (arr.length + 1 - i)
    const r = (s * 10) % 11
    return r === 10 ? 0 : r
  }
  const d1 = dig(n)
  const d2 = dig([...n, d1])
  return [...n, d1, d2].join("")
}

async function main() {
  console.log("🌱 Iniciando seed...")

  await db.frequencia.deleteMany()
  await db.pagamento.deleteMany()
  await db.custo.deleteMany()
  await db.aluno.deleteMany()
  await db.responsavel.deleteMany()

  for (const aluno of alunosData) {
    await db.aluno.create({ data: aluno })
  }
  console.log(`✅ ${alunosData.length} alunos inseridos`)

  await db.custo.createMany({ data: custosData })
  console.log(`✅ ${custosData.length} custos inseridos`)

  const alunos = await db.aluno.findMany({ orderBy: { id: "asc" } })
  const [lucas, gabriel, matheus, pedro, joao, felipe, arthur, bruno] = alunos

  // Cria um responsável (pagador) com CPF para cada aluno e vincula.
  // CPF é exigido pelo Mercado Pago na emissão de boleto.
  for (const aluno of alunos) {
    const resp = await db.responsavel.create({
      data: {
        nome: aluno.responsavel || `Responsável de ${aluno.nome}`,
        email: `resp.aluno${aluno.id}@teste.com`,
        telefone: aluno.telefone || "11999999999",
        senha: "$2a$10$seedPlaceholderHashNaoUsarParaLogin",
        cpf: geraCpf(),
      },
    })
    await db.aluno.update({ where: { id: aluno.id }, data: { responsavelId: resp.id } })
  }
  console.log(`✅ ${alunos.length} responsáveis criados e vinculados`)

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

  // Pagamentos pendentes no mês atual (dinâmico) — garante que sempre haja
  // cobranças para testar a emissão de PIX/Boleto, independente de quando rodar.
  const agora = new Date()
  const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`
  const vencimentoAtual = new Date(agora.getFullYear(), agora.getMonth(), 10)
  for (const aluno of alunos) {
    pagamentos.push({
      alunoId: aluno.id,
      mesReferencia: mesAtual,
      dataVencimento: vencimentoAtual,
      dataPagamento: null,
      formaPagamento: null,
      valorRecebido: null,
    })
  }

  await db.pagamento.createMany({ data: pagamentos })
  console.log(`✅ ${pagamentos.length} pagamentos inseridos`)

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
