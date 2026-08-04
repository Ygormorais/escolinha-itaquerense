import { db } from "@/lib/db"
import { RESP_TESTE } from "./test-credentials"

const PAGAMENTO_PREFIX = "E2E Aluno Pagamentos "
const PRE_MATRICULA_NOME = "Teste E2E Admin Pendente"
const CUSTO_PREFIX = "Custo E2E"
const RECIBO_PREFIX = "E2E Recibo"
const MAQUINA_ARQUIVO = "e2e-maquina.csv"
const ALUNO_FLUXOS_PREFIX = "E2E Aluno Fluxos "
const ALUNO_CRIADO_PREFIX = "E2E Aluno Criado "
const ALUNO_INADIMPLENTE = "E2E Aluno Inadimplente"
const ALUNO_OPERACIONAL = "E2E Aluno Operacional"
const PRODUTO_PREFIX = "E2E Produto "
const CAMPEONATO_NOME = "E2E Campeonato Fluxos"
const SOLICITACAO_DESCRICAO = "E2E Solicitação Pendente"
const HISTORICO_DESCRICAO = "E2E Histórico Fixture"

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
          create: {
            mesReferencia: referencia,
            dataVencimento: vencimento,
            ...(numero === 3
              ? {
                  canalPrevisto: "PIX",
                  statusCobranca: "pendente",
                  externalId: "e2e-mp-cobranca",
                  pixCopiaECola: "00020126580014br.gov.bcb.pix0136e2e-cobranca-controlada",
                }
              : {}),
          },
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

export async function resetAlunosFluxosE2E() {
  await db.aluno.deleteMany({
    where: {
      OR: [
        { nome: { startsWith: ALUNO_FLUXOS_PREFIX } },
        { nome: { startsWith: ALUNO_CRIADO_PREFIX } },
      ],
    },
  })

  const dadosBase = {
    dataNascimento: new Date(2015, 5, 15, 12),
    turma: "E2E Testes",
    horario: "Seg/Qua 08h",
    responsavel: "Responsável E2E",
    telefone: "11999998888",
    dataMatricula: new Date(),
    mensalidade: 180,
    status: "Ativo",
  }

  await db.aluno.create({
    data: {
      ...dadosBase,
      nome: `${ALUNO_FLUXOS_PREFIX}Com Dados`,
      email: "fluxos.dados@e2e.test",
      avaliacoes: {
        create: {
          periodo: "2026-1S",
          notaTecnica: 8,
          notaFisica: 7.5,
          notaComportamento: 9,
          frequencia: 88,
          observacoes: "Avaliação E2E",
        },
      },
      uniformes: {
        create: { item: "Camisa", tamanho: "M", entregue: false },
      },
    },
  })

  await db.aluno.create({
    data: {
      ...dadosBase,
      nome: `${ALUNO_FLUXOS_PREFIX}Sem Itens`,
      email: "fluxos.sem-itens@e2e.test",
    },
  })
}

export async function resetProdutosE2E() {
  await db.produto.deleteMany({ where: { nome: { startsWith: PRODUTO_PREFIX } } })
  await db.produto.create({
    data: {
      nome: `${PRODUTO_PREFIX}Fixture`,
      descricao: "Produto controlado pelos testes E2E",
      preco: 49.9,
      categoria: "uniforme",
      tamanhos: "P,M,G",
      estoque: 5,
      ativo: true,
    },
  })
}

export async function resetInadimplenciaE2E() {
  await db.aluno.deleteMany({ where: { nome: ALUNO_INADIMPLENTE } })

  const hoje = new Date()
  const vencimento = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 10, 12)
  const referencia = `${vencimento.getFullYear()}-${String(vencimento.getMonth() + 1).padStart(2, "0")}`

  await db.aluno.create({
    data: {
      nome: ALUNO_INADIMPLENTE,
      dataNascimento: new Date(2015, 5, 15, 12),
      turma: "Sub-11",
      horario: "Seg/Qua 08h",
      responsavel: "Responsável Inadimplência E2E",
      telefone: "11999996666",
      email: "inadimplente@e2e.test",
      dataMatricula: hoje,
      mensalidade: 175,
      status: "Ativo",
      pagamentos: { create: { mesReferencia: referencia, dataVencimento: vencimento } },
    },
  })
}

export async function resetOperacionalE2E() {
  await db.aluno.deleteMany({ where: { nome: ALUNO_OPERACIONAL } })

  const hoje = new Date()
  await db.aluno.create({
    data: {
      nome: ALUNO_OPERACIONAL,
      dataNascimento: new Date(2015, hoje.getMonth(), hoje.getDate(), 12),
      turma: "Sub-11",
      horario: "Seg/Qua 08h",
      responsavel: "Responsável Operacional E2E",
      telefone: "11999995555",
      email: "operacional@e2e.test",
      dataMatricula: hoje,
      mensalidade: 190,
      status: "Ativo",
      tipoSanguineo: "O+",
      alergias: "Amendoim",
      contatoEmergenciaNome: "Contato E2E",
      contatoEmergenciaTel: "11988887777",
      contatoEmergenciaParentesco: "Mãe",
      frequencias: { create: { data: hoje, presenca: "Presente" } },
    },
  })
}

export async function resetCampeonatoE2E() {
  await db.campeonato.deleteMany({ where: { nome: CAMPEONATO_NOME } })

  const dataPartida = new Date()
  dataPartida.setDate(dataPartida.getDate() + 2)
  dataPartida.setHours(15, 0, 0, 0)

  const campeonato = await db.campeonato.create({
    data: {
      nome: CAMPEONATO_NOME,
      descricao: "Competição controlada pelos testes E2E",
      dataInicio: new Date(),
      local: "Ginásio E2E",
      status: "aberto",
      partidas: {
        create: {
          rodada: 1,
          data: dataPartida,
          adversario: "E2E Adversário",
          local: "Casa",
        },
      },
    },
    include: { partidas: { select: { id: true } } },
  })

  return { campeonatoId: campeonato.id, partidaId: campeonato.partidas[0].id }
}

export async function resetHistoricoE2E() {
  await db.log.deleteMany({ where: { descricao: HISTORICO_DESCRICAO } })
  await db.log.create({
    data: {
      tipo: "e2e_historico",
      descricao: HISTORICO_DESCRICAO,
      usuario: "E2E Admin",
    },
  })
}

export async function resetSolicitacaoE2E() {
  const responsavel = await db.responsavel.findUnique({
    where: { email: RESP_TESTE.email },
    select: { id: true },
  })
  if (!responsavel) throw new Error("Responsável E2E não foi criado pelo global setup")

  await db.solicitacao.deleteMany({ where: { descricao: SOLICITACAO_DESCRICAO } })
  await db.solicitacao.create({
    data: {
      responsavelId: responsavel.id,
      tipo: "outro",
      descricao: SOLICITACAO_DESCRICAO,
      status: "pendente",
    },
  })
}
