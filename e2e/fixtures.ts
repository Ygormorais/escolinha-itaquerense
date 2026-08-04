import { db } from "@/lib/db"

const PAGAMENTO_PREFIX = "E2E Aluno Pagamentos "
const PRE_MATRICULA_NOME = "Teste E2E Admin Pendente"
const CUSTO_PREFIX = "Custo E2E"
const RECIBO_PREFIX = "E2E Recibo"
const MAQUINA_ARQUIVO = "e2e-maquina.csv"

function mesAtual() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

export async function resetPagamentosE2E() {
  const existentes = await db.aluno.findMany({
    where: { nome: { startsWith: PAGAMENTO_PREFIX } },
    select: { id: true },
  })

  if (existentes.length > 0) {
    await db.aluno.deleteMany({ where: { id: { in: existentes.map(({ id }) => id) } } })
  }

  const now = new Date()
  const referencia = mesAtual()
  const vencimento = new Date(now.getFullYear(), now.getMonth() + 1, 10, 12)
  const dataNascimento = new Date(2015, 5, 15, 12)

  for (const numero of [1, 2, 3]) {
    await db.aluno.create({
      data: {
        nome: `${PAGAMENTO_PREFIX}${numero}`,
        dataNascimento,
        turma: "E2E Testes",
        horario: "09:00",
        responsavel: "Responsável E2E",
        telefone: "11999998888",
        email: `pagamentos.${numero}@e2e.test`,
        dataMatricula: now,
        mensalidade: 150,
        status: "Ativo",
        pagamentos: {
          create: { mesReferencia: referencia, dataVencimento: vencimento },
        },
      },
    })
  }

  await db.aluno.create({
    data: {
      nome: `${PAGAMENTO_PREFIX}Pago`,
      dataNascimento,
      turma: "E2E Testes",
      horario: "09:00",
      responsavel: "Responsável E2E",
      telefone: "11999998888",
      email: "pagamentos.pago@e2e.test",
      dataMatricula: now,
      mensalidade: 150,
      status: "Ativo",
      pagamentos: {
        create: {
          mesReferencia: referencia,
          dataVencimento: vencimento,
          dataPagamento: now,
          formaPagamento: "PIX",
          valorRecebido: 150,
        },
      },
    },
  })
}

export async function resetPreMatriculaPendenteE2E() {
  await db.preMatricula.deleteMany({ where: { nomeAluno: PRE_MATRICULA_NOME } })
  await db.preMatricula.create({
    data: {
      nomeAluno: PRE_MATRICULA_NOME,
      dataNascimento: new Date(2015, 5, 15, 12),
      turma: "Sub-11",
      horario: "09:00",
      nomeResponsavel: "Responsável E2E",
      telefone: "11999998888",
      email: "matricula.admin@e2e.test",
      status: "pendente",
    },
  })
}

export async function resetCustosE2E() {
  await db.custo.deleteMany({ where: { descricao: { startsWith: CUSTO_PREFIX } } })
  await db.custo.create({
    data: {
      data: new Date(),
      categoria: "Outros",
      descricao: `${CUSTO_PREFIX} Fixture`,
      fornecedor: "Fornecedor E2E",
      valor: 125,
      formaPagamento: "PIX",
    },
  })
}

export async function resetRecibosE2E() {
  await db.recibo.deleteMany({ where: { alunoNome: { startsWith: RECIBO_PREFIX } } })
  await db.recibo.create({
    data: {
      numero: `E2E-${Date.now()}`,
      alunoNome: `${RECIBO_PREFIX} Fixture`,
      responsavel: "Responsável E2E",
      mesReferencia: mesAtual(),
      valor: 150,
      formaPagamento: "PIX",
      dataPagamento: new Date(),
    },
  })
}

export async function resetCaixaE2E() {
  await db.transacaoMaquina.deleteMany({ where: { arquivo: MAQUINA_ARQUIVO } })
  await resetPagamentosE2E()
  await db.transacaoMaquina.create({
    data: {
      dataTransacao: new Date(),
      valor: 123.45,
      parcelas: 1,
      bandeira: "Visa",
      tipo: "debito",
      nomeNoCartao: "E2E MAQUINA",
      arquivo: MAQUINA_ARQUIVO,
      status: "pendente",
    },
  })
}
