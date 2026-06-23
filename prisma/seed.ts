import { alunosData } from "../lib/seed-data"
import { db } from "../lib/db"
import { hashSync } from "bcryptjs"

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

  // Limpa tudo em ordem de dependência
  await db.avaliacao.deleteMany()
  await db.inscricaoCampeonato.deleteMany()
  await db.partida.deleteMany()
  await db.campeonato.deleteMany()
  await db.frequencia.deleteMany()
  await db.pagamento.deleteMany()
  await db.custo.deleteMany()
  await db.custoRecorrente.deleteMany()
  await db.uniforme.deleteMany()
  await db.aluno.deleteMany()
  await db.responsavel.deleteMany()

  // ── Alunos ───────────────────────────────────────────────────────────────
  for (const aluno of alunosData) {
    await db.aluno.create({ data: aluno })
  }
  console.log(`✅ ${alunosData.length} alunos inseridos`)

  // ── Custos ───────────────────────────────────────────────────────────────
  const custosData = [
    { data: new Date("2026-01-05"), categoria: "Material",    descricao: "Bolas de futebol (10 un)",     fornecedor: "SportStore",       valor: 350,  formaPagamento: "PIX",           comprovante: true  },
    { data: new Date("2026-01-10"), categoria: "Aluguel",     descricao: "Campo de treino — janeiro",    fornecedor: "Clube Municipal",  valor: 800,  formaPagamento: "Transferência", comprovante: true  },
    { data: new Date("2026-02-10"), categoria: "Aluguel",     descricao: "Campo de treino — fevereiro",  fornecedor: "Clube Municipal",  valor: 800,  formaPagamento: "Transferência", comprovante: true  },
    { data: new Date("2026-02-20"), categoria: "Uniformes",   descricao: "Camisas treino (10 un)",       fornecedor: "Loja do Esporte",  valor: 600,  formaPagamento: "Cartão",        comprovante: true  },
    { data: new Date("2026-03-10"), categoria: "Aluguel",     descricao: "Campo de treino — março",      fornecedor: "Clube Municipal",  valor: 800,  formaPagamento: "Transferência", comprovante: true  },
    { data: new Date("2026-03-15"), categoria: "Inscrição",   descricao: "Inscrição Campeonato Regional",fornecedor: "FPFS",             valor: 480,  formaPagamento: "PIX",           comprovante: true  },
    { data: new Date("2026-04-10"), categoria: "Aluguel",     descricao: "Campo de treino — abril",      fornecedor: "Clube Municipal",  valor: 800,  formaPagamento: "Transferência", comprovante: true  },
    { data: new Date("2026-04-25"), categoria: "Alimentação", descricao: "Lanche pós-jogo (8 alunos)",   fornecedor: "Padaria Central",  valor: 120,  formaPagamento: "Dinheiro",      comprovante: false },
    { data: new Date("2026-05-10"), categoria: "Aluguel",     descricao: "Campo de treino — maio",       fornecedor: "Clube Municipal",  valor: 800,  formaPagamento: "Transferência", comprovante: true  },
    { data: new Date("2026-05-20"), categoria: "Material",    descricao: "Cones e coletes de treino",    fornecedor: "SportStore",       valor: 180,  formaPagamento: "PIX",           comprovante: true  },
    { data: new Date("2026-06-10"), categoria: "Aluguel",     descricao: "Campo de treino — junho",      fornecedor: "Clube Municipal",  valor: 800,  formaPagamento: "Transferência", comprovante: true  },
  ]
  await db.custo.createMany({ data: custosData })
  console.log(`✅ ${custosData.length} custos inseridos`)

  // ── Custos recorrentes ────────────────────────────────────────────────────
  await db.custoRecorrente.createMany({
    data: [
      { descricao: "Aluguel do campo",    categoria: "Aluguel",  fornecedor: "Clube Municipal", valor: 800, formaPagamento: "Transferência", ativo: true  },
      { descricao: "Internet escritório", categoria: "Serviços", fornecedor: "Vivo Empresas",   valor:  99, formaPagamento: "Débito auto",   ativo: true  },
      { descricao: "Seguro de material",  categoria: "Outros",   fornecedor: "Seguradora SP",   valor: 120, formaPagamento: "Boleto",        ativo: false },
    ],
  })
  console.log("✅ Custos recorrentes inseridos")

  const alunos = await db.aluno.findMany({ orderBy: { id: "asc" } })
  const [lucas, gabriel, matheus, pedro, joao, felipe, arthur, bruno] = alunos

  // ── Responsáveis ─────────────────────────────────────────────────────────
  // Senha padrão para testes: "escolinha123"
  const senhaHash = hashSync("escolinha123", 10)

  for (const aluno of alunos) {
    const resp = await db.responsavel.create({
      data: {
        nome: aluno.responsavel || `Responsável de ${aluno.nome}`,
        email: `resp.aluno${aluno.id}@teste.com`,
        telefone: aluno.telefone || "11999999999",
        senha: senhaHash,
        cpf: geraCpf(),
      },
    })
    await db.aluno.update({ where: { id: aluno.id }, data: { responsavelId: resp.id } })
  }
  console.log(`✅ ${alunos.length} responsáveis criados e vinculados`)

  // ── Pagamentos ────────────────────────────────────────────────────────────
  // Histórico 2026 — cobre Jan-Mai com mix de pago/pendente
  const mesesHistorico = [
    "2026-01", "2026-02", "2026-03", "2026-04", "2026-05",
  ]
  const pagamentos: {
    alunoId: number
    mesReferencia: string
    dataVencimento: Date
    dataPagamento: Date | null
    formaPagamento: string | null
    valorRecebido: number | null
  }[] = []

  const formas = ["PIX", "Dinheiro", "Cartão", "Transferência"]

  for (const mes of mesesHistorico) {
    const [ano, m] = mes.split("-").map(Number)
    const venc = new Date(ano, m - 1, 10)
    for (let i = 0; i < alunos.length; i++) {
      const aluno = alunos[i]
      // Arthur (idx 6) tem alta inadimplência; Pedro (idx 3) paga sempre
      const pago =
        i === 6 ? mes < "2026-03"        // Arthur: só pagou jan/fev
        : i === 3 ? true                  // Pedro: sempre em dia
        : Math.random() > 0.2             // demais: ~80% pagos

      const diasApos = pago ? Math.floor(Math.random() * 12) - 2 : 0 // -2..+9 dias do venc
      const dataPag = pago ? new Date(venc.getTime() + diasApos * 86_400_000) : null
      const forma = pago ? formas[Math.floor(Math.random() * formas.length)] : null

      pagamentos.push({
        alunoId: aluno.id,
        mesReferencia: mes,
        dataVencimento: venc,
        dataPagamento: dataPag,
        formaPagamento: forma,
        valorRecebido: pago ? aluno.mensalidade : null,
      })
    }
  }

  // Mês atual — todos pendentes (para testar cobrança/PIX)
  const agora = new Date()
  const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`
  const vencAtual = new Date(agora.getFullYear(), agora.getMonth(), 10)
  for (const aluno of alunos) {
    pagamentos.push({
      alunoId: aluno.id,
      mesReferencia: mesAtual,
      dataVencimento: vencAtual,
      dataPagamento: null,
      formaPagamento: null,
      valorRecebido: null,
    })
  }

  await db.pagamento.createMany({ data: pagamentos })
  console.log(`✅ ${pagamentos.length} pagamentos inseridos`)

  // ── Frequências ───────────────────────────────────────────────────────────
  // Gera treinos Ter/Qui de abril a junho/2026
  const frequencias: { alunoId: number; data: Date; presenca: string }[] = []

  const diasTreino: Date[] = []
  // abril: 01/04 a 30/04, ter=2 qui=4
  // maio: 01/05 a 31/05
  // junho: 01/06 a 20/06
  const periodos = [
    { ano: 2026, mes: 3 }, // abril (0-indexed)
    { ano: 2026, mes: 4 }, // maio
    { ano: 2026, mes: 5 }, // junho
  ]
  for (const { ano, mes } of periodos) {
    const diasNoMes = new Date(ano, mes + 1, 0).getDate()
    for (let d = 1; d <= diasNoMes; d++) {
      const dt = new Date(ano, mes, d)
      if (dt > agora) break
      const dow = dt.getDay() // 2=ter, 4=qui
      if (dow === 2 || dow === 4) diasTreino.push(dt)
    }
  }

  for (const aluno of alunos) {
    for (const dt of diasTreino) {
      // arthur tem presença muito ruim (~20%), outros ~85%
      const idx = alunos.indexOf(aluno)
      const chance = idx === 6 ? 0.20 : 0.85
      const rand = Math.random()
      const presenca =
        rand < chance ? "Presente"
        : rand < chance + 0.05 ? "Justificado"
        : "Ausente"
      frequencias.push({ alunoId: aluno.id, data: dt, presenca })
    }
  }

  await db.frequencia.createMany({ data: frequencias })
  console.log(`✅ ${frequencias.length} registros de frequência inseridos`)

  // ── Avaliações ────────────────────────────────────────────────────────────
  const avaliacoes = [
    // 1º semestre 2026
    { alunoId: lucas.id,   periodo: "2026-1S", notaTecnica: 7.5, notaFisica: 8.0, notaComportamento: 9.0, frequencia: 88, observacoes: "Bom desempenho geral, melhorou o passe."        },
    { alunoId: gabriel.id, periodo: "2026-1S", notaTecnica: 8.5, notaFisica: 7.5, notaComportamento: 8.5, frequencia: 92, observacoes: "Destaque no campeonato, liderança em campo."    },
    { alunoId: matheus.id, periodo: "2026-1S", notaTecnica: 6.5, notaFisica: 7.0, notaComportamento: 8.0, frequencia: 80, observacoes: "Precisa melhorar o chute e condicionamento."   },
    { alunoId: pedro.id,   periodo: "2026-1S", notaTecnica: 9.0, notaFisica: 9.0, notaComportamento: 9.5, frequencia: 98, observacoes: "Excelente aluno, candidato a capitão."          },
    { alunoId: joao.id,    periodo: "2026-1S", notaTecnica: 7.0, notaFisica: 8.5, notaComportamento: 7.5, frequencia: 85, observacoes: "Potencial físico alto, foco na técnica."         },
    { alunoId: felipe.id,  periodo: "2026-1S", notaTecnica: 6.0, notaFisica: 6.5, notaComportamento: 8.5, frequencia: 82, observacoes: "Bom comportamento, evolução técnica lenta."     },
    { alunoId: arthur.id,  periodo: "2026-1S", notaTecnica: 5.5, notaFisica: 5.0, notaComportamento: 7.0, frequencia: 22, observacoes: "Muitas faltas comprometem o desenvolvimento."  },
    { alunoId: bruno.id,   periodo: "2026-1S", notaTecnica: 8.0, notaFisica: 7.5, notaComportamento: 9.0, frequencia: 90, observacoes: "Consistente, bom em jogadas de transição."     },
  ]
  await db.avaliacao.createMany({ data: avaliacoes })
  console.log("✅ Avaliações inseridas")

  // ── Campeonato ────────────────────────────────────────────────────────────
  const camp = await db.campeonato.create({
    data: {
      nome: "Copa Regional Sub-15 2026",
      descricao: "Campeonato regional de futebol de campo, fase eliminatória",
      dataInicio: new Date("2026-04-05"),
      dataFim: new Date("2026-07-20"),
      local: "Estádio Municipal de Itaquera",
      taxaInscricao: 80,
      taxaJogo: 40,
      taxaArbitragem: 60,
      custoTransporte: 200,
      status: "andamento",
    },
  })

  // Inscrições no campeonato (alunos Sub-15)
  const sub15 = alunos.filter((a) => a.turma === "Sub-15")
  for (const aluno of sub15) {
    await db.inscricaoCampeonato.create({
      data: {
        alunoId: aluno.id,
        campeonatoId: camp.id,
        taxaPaga: true,
        valorPago: camp.taxaInscricao,
        formaPagamento: "PIX",
      },
    })
  }

  // Partidas
  await db.partida.createMany({
    data: [
      { campeonatoId: camp.id, adversario: "EC São Mateus",    data: new Date("2026-04-12"), local: "Casa", golsPro: 3, golsContra: 1, resultado: "Vitoria",  observacoes: "Ótima atuação, Gabriel fez 2 gols." },
      { campeonatoId: camp.id, adversario: "Futsal Penha",     data: new Date("2026-04-26"), local: "Fora", golsPro: 1, golsContra: 1, resultado: "Empate",   observacoes: "Jogo equilibrado, empate justo."    },
      { campeonatoId: camp.id, adversario: "AD Guaianases",    data: new Date("2026-05-10"), local: "Casa", golsPro: 2, golsContra: 0, resultado: "Vitoria",  observacoes: "Defesa sólida, vitória tranquila."  },
      { campeonatoId: camp.id, adversario: "Associação Ermel", data: new Date("2026-05-24"), local: "Fora", golsPro: 0, golsContra: 2, resultado: "Derrota",  observacoes: "Dificuldade no campo adversário."   },
      { campeonatoId: camp.id, adversario: "EC Itaim Paulista",data: new Date("2026-06-07"), local: "Casa", golsPro: 4, golsContra: 1, resultado: "Vitoria",  observacoes: "Melhor jogo do campeonato até aqui."},
      { campeonatoId: camp.id, adversario: "SC Cohab",         data: new Date("2026-07-12"), local: "Casa", golsPro: null, golsContra: null, resultado: null,  observacoes: "Semifinal — data confirmada."       },
    ],
  })
  console.log(`✅ Campeonato "${camp.nome}" criado com partidas`)

  // ── Uniformes ─────────────────────────────────────────────────────────────
  const uniformeItems = [
    { alunoId: lucas.id,   item: "Camisa treino", tamanho: "M",  entregue: true,  dataEntrega: new Date("2026-02-05"), observacoes: null        },
    { alunoId: gabriel.id, item: "Camisa treino", tamanho: "G",  entregue: true,  dataEntrega: new Date("2026-02-05"), observacoes: null        },
    { alunoId: matheus.id, item: "Camisa treino", tamanho: "M",  entregue: true,  dataEntrega: new Date("2026-02-05"), observacoes: null        },
    { alunoId: pedro.id,   item: "Camisa treino", tamanho: "G",  entregue: true,  dataEntrega: new Date("2026-02-10"), observacoes: "Recebeu 2" },
    { alunoId: joao.id,    item: "Camisa treino", tamanho: "GG", entregue: true,  dataEntrega: new Date("2026-02-10"), observacoes: null        },
    { alunoId: felipe.id,  item: "Camisa treino", tamanho: "P",  entregue: false, dataEntrega: null,                  observacoes: "Aguardando"},
    { alunoId: arthur.id,  item: "Camisa treino", tamanho: "P",  entregue: false, dataEntrega: null,                  observacoes: null        },
    { alunoId: bruno.id,   item: "Camisa treino", tamanho: "M",  entregue: true,  dataEntrega: new Date("2026-02-05"), observacoes: null        },
    { alunoId: lucas.id,   item: "Shorts",        tamanho: "M",  entregue: true,  dataEntrega: new Date("2026-02-05"), observacoes: null        },
    { alunoId: gabriel.id, item: "Shorts",        tamanho: "G",  entregue: true,  dataEntrega: new Date("2026-02-05"), observacoes: null        },
  ]
  await db.uniforme.createMany({ data: uniformeItems })
  console.log("✅ Uniformes inseridos")

  console.log("🎉 Seed concluído!")
}

main().catch(console.error).finally(() => db.$disconnect())
