/**
 * Seed de demonstração — popula um banco isolado (demo.db) com dados fictícios
 * para apresentar o sistema ao clube antes do go-live.
 *
 * Uso:
 *   npm run db:seed-demo
 *
 * O script:
 *   1. Apaga e recria o demo.db (banco separado, nunca toca no dev.db)
 *   2. Aplica as migrations
 *   3. Insere dados fictícios realistas
 *
 * Para rodar o app apontado ao demo:
 *   DATABASE_URL=file:./prisma/demo.db npm run dev
 */

import { execSync } from "child_process"
import path from "path"
import fs from "fs"
import { PrismaClient } from "@prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import { hashSync } from "bcryptjs"
import { addDays, subDays, format, startOfMonth, setDate } from "date-fns"

// ── 1. Setup do banco demo ─────────────────────────────────────────────────

const DEMO_DB = path.join(process.cwd(), "prisma", "demo.db")
const DEMO_URL = `file:${DEMO_DB}`

// Remove o banco anterior para começar limpo
if (fs.existsSync(DEMO_DB)) fs.unlinkSync(DEMO_DB)
if (fs.existsSync(DEMO_DB + "-shm")) fs.unlinkSync(DEMO_DB + "-shm")
if (fs.existsSync(DEMO_DB + "-wal")) fs.unlinkSync(DEMO_DB + "-wal")

console.log("⚙️  Aplicando migrations no demo.db...")
execSync(`npx prisma migrate deploy`, {
  env: { ...process.env, DATABASE_URL: DEMO_URL },
  stdio: "inherit",
})

// ── 2. Cliente apontado ao demo.db ─────────────────────────────────────────

const adapter = new PrismaBetterSqlite3({ url: DEMO_URL })
const db = new PrismaClient({ adapter, log: ["error"] })

// ── 3. Dados fictícios ─────────────────────────────────────────────────────

const HOJE = new Date()
const ANO = HOJE.getFullYear()
const MES = HOJE.getMonth() // 0-based

function data(ano: number, mes: number, dia: number) {
  return new Date(ano, mes, dia, 12, 0, 0)
}

function nascimento(ano: number) {
  return new Date(ano, 4, 15, 0, 0, 0) // 15/mai
}

const ALUNOS_RAW = [
  // Sub-7 (2017-2018)
  { nome: "Gabriel Ferreira Lima",     turma: "Sub-7",  nasc: 2018, horario: "Seg/Qua 14h", mensalidade: 120, responsavel: "Marcos Ferreira Lima",     telefone: "11987650001", email: "marcos.lima@email.com" },
  { nome: "Arthur Souza Mendes",       turma: "Sub-7",  nasc: 2017, horario: "Seg/Qua 14h", mensalidade: 120, responsavel: "Fernanda Souza Mendes",    telefone: "11987650002", email: "fernanda.mendes@email.com" },

  // Sub-9 (2015-2016)
  { nome: "Mateus Oliveira Costa",     turma: "Sub-9",  nasc: 2016, horario: "Ter/Qui 15h", mensalidade: 130, responsavel: "Carlos Oliveira Costa",    telefone: "11987650003", email: "carlos.oliveira@email.com" },
  { nome: "Pedro Almeida Rocha",       turma: "Sub-9",  nasc: 2015, horario: "Ter/Qui 15h", mensalidade: 130, responsavel: "Patrícia Almeida Rocha",   telefone: "11987650004", email: "patricia.rocha@email.com" },
  { nome: "Lucas Santana Reis",        turma: "Sub-9",  nasc: 2016, horario: "Ter/Qui 15h", mensalidade: 130, responsavel: "Renata Santana Reis",      telefone: "11987650005", email: "renata.reis@email.com" },

  // Sub-11 (2013-2014)
  { nome: "Felipe Martins Carvalho",   turma: "Sub-11", nasc: 2013, horario: "Seg/Qua 16h", mensalidade: 140, responsavel: "Eduardo Martins Carvalho", telefone: "11987650006", email: "eduardo.carvalho@email.com" },
  { nome: "Thiago Pereira Gomes",      turma: "Sub-11", nasc: 2014, horario: "Seg/Qua 16h", mensalidade: 140, responsavel: "Cláudia Pereira Gomes",   telefone: "11987650007", email: "claudia.gomes@email.com" },
  { nome: "Rafael Barbosa Nascimento", turma: "Sub-11", nasc: 2013, horario: "Seg/Qua 16h", mensalidade: 120, responsavel: "Ana Barbosa Nascimento",   telefone: "11987650008", email: "ana.barbosa@email.com" },
  { nome: "João Victor Araújo",        turma: "Sub-11", nasc: 2014, horario: "Seg/Qua 16h", mensalidade: 140, responsavel: "Marcia Araújo Pinto",      telefone: "11987650009", email: "marcia.araujo@email.com" },

  // Sub-13 (2011-2012)
  { nome: "Bruno Henrique Torres",     turma: "Sub-13", nasc: 2012, horario: "Ter/Qui 17h", mensalidade: 150, responsavel: "Roberto Torres Filho",     telefone: "11987650010", email: "roberto.torres@email.com" },
  { nome: "Diego Campos Freitas",      turma: "Sub-13", nasc: 2011, horario: "Ter/Qui 17h", mensalidade: 150, responsavel: "Juliana Campos Freitas",   telefone: "11987650011", email: "juliana.campos@email.com" },
  { nome: "Vinicius Monteiro Dias",    turma: "Sub-13", nasc: 2012, horario: "Ter/Qui 17h", mensalidade: 150, responsavel: "Fabio Monteiro Dias",      telefone: "11987650012", email: "fabio.monteiro@email.com" },
  { nome: "Lucas Gonçalves Silva",     turma: "Sub-13", nasc: 2011, horario: "Ter/Qui 17h", mensalidade: 150, responsavel: "Sandra Gonçalves Silva",   telefone: "11987650013", email: "sandra.silva@email.com" },
  { nome: "Kaique Ribeiro Santos",     turma: "Sub-13", nasc: 2012, horario: "Ter/Qui 17h", mensalidade: 0,   responsavel: "Marcos Ribeiro Santos",    telefone: "11987650014", email: "marcos.ribeiro@email.com", bolsista: true },

  // Sub-15 (2009-2010)
  { nome: "Gustavo Leal Azevedo",      turma: "Sub-15", nasc: 2009, horario: "Seg/Qua 18h", mensalidade: 160, responsavel: "Paulo Leal Azevedo",       telefone: "11987650015", email: "paulo.leal@email.com" },
  { nome: "Rodrigo Castro Vieira",     turma: "Sub-15", nasc: 2010, horario: "Seg/Qua 18h", mensalidade: 160, responsavel: "Simone Castro Vieira",     telefone: "11987650016", email: "simone.castro@email.com" },
  { nome: "Willian Andrade Farias",    turma: "Sub-15", nasc: 2009, horario: "Seg/Qua 18h", mensalidade: 160, responsavel: "Luciana Andrade Farias",   telefone: "11987650017", email: "luciana.andrade@email.com" },
  { nome: "Anderson Nunes Correia",    turma: "Sub-15", nasc: 2010, horario: "Seg/Qua 18h", mensalidade: 160, responsavel: "Adriana Nunes Correia",    telefone: "11987650018", email: "adriana.nunes@email.com", inativo: true },

  // Sub-17 (2007-2008)
  { nome: "Renato Pinto Cavalcante",   turma: "Sub-17", nasc: 2007, horario: "Ter/Qui 19h", mensalidade: 170, responsavel: "Sérgio Pinto Cavalcante",  telefone: "11987650019", email: "sergio.cavalcante@email.com" },
  { nome: "Caio Mendonça Teixeira",    turma: "Sub-17", nasc: 2008, horario: "Ter/Qui 19h", mensalidade: 170, responsavel: "Vera Mendonça Teixeira",   telefone: "11987650020", email: "vera.mendonca@email.com" },
  { nome: "Leandro Ramos Bezerra",     turma: "Sub-17", nasc: 2007, horario: "Ter/Qui 19h", mensalidade: 170, responsavel: "Eliane Ramos Bezerra",     telefone: "11987650021", email: "eliane.ramos@email.com" },
] as const

type AlunoRaw = typeof ALUNOS_RAW[number] & { bolsista?: boolean; inativo?: boolean }

async function main() {
  console.log("\n🌱 Populando demo.db com dados fictícios...\n")

  // ── Admin ────────────────────────────────────────────────────────────────
  await db.usuario.create({
    data: {
      username: "admin",
      nome: "Administrador",
      senha: hashSync("demo123", 10),
      role: "admin",
      ativo: true,
    },
  })
  console.log("✓ Usuário admin (senha: demo123)")

  // ── Alunos + Pagamentos + Frequências ────────────────────────────────────
  const alunosDb: Array<{ id: number; raw: AlunoRaw }> = []

  for (const raw of ALUNOS_RAW as unknown as AlunoRaw[]) {
    const aluno = await db.aluno.create({
      data: {
        nome: raw.nome,
        dataNascimento: nascimento(raw.nasc),
        turma: raw.turma,
        horario: raw.horario,
        responsavel: raw.responsavel,
        telefone: raw.telefone,
        email: raw.email,
        dataMatricula: data(ANO - 1, 1, 10),
        mensalidade: raw.mensalidade,
        status: raw.inativo ? "Inativo" : "Ativo",
        observacoes: raw.bolsista ? "Bolsista — isento de mensalidade" : null,
      },
    })
    alunosDb.push({ id: aluno.id, raw })
  }
  console.log(`✓ ${ALUNOS_RAW.length} alunos criados`)

  // ── Pagamentos (jan até mês atual do ano corrente) ─────────────────────
  const MESES_PAGAR = MES + 1 // jan=1 até mês atual
  let pagTotal = 0

  for (const { id, raw } of alunosDb) {
    if ((raw as AlunoRaw).inativo || raw.mensalidade === 0) continue

    for (let m = 1; m <= MESES_PAGAR; m++) {
      const venc = data(ANO, m - 1, 10) // dia 10 de cada mês
      const mesRef = `${ANO}-${String(m).padStart(2, "0")}`

      // Meses passados: 85% pagos; mês atual: 40% pagos
      const taxa = m < MESES_PAGAR ? 0.85 : 0.40
      const pago = Math.random() < taxa

      await db.pagamento.create({
        data: {
          alunoId: id,
          mesReferencia: mesRef,
          dataVencimento: venc,
          dataPagamento: pago ? addDays(venc, Math.floor(Math.random() * 5)) : null,
          formaPagamento: pago ? (["PIX", "PIX", "Dinheiro", "Maquininha"][Math.floor(Math.random() * 4)]) : null,
          valorRecebido: pago ? raw.mensalidade : null,
        },
      })
      pagTotal++
    }
  }
  console.log(`✓ ${pagTotal} pagamentos gerados`)

  // ── Frequências (últimas 4 semanas — ter e qui) ───────────────────────
  const alunosAtivos = alunosDb.filter(({ raw }) => !(raw as AlunoRaw).inativo)
  let freqTotal = 0

  // Datas de treino: ter e qui das últimas 4 semanas
  const datasFreq: Date[] = []
  for (let semana = 4; semana >= 0; semana--) {
    for (const diaSemana of [2, 4]) { // ter=2, qui=4
      const d = new Date(HOJE)
      d.setDate(d.getDate() - semana * 7)
      // Ajusta para o dia da semana correto
      const diff = (diaSemana - d.getDay() + 7) % 7
      const dataFreq = new Date(d)
      dataFreq.setDate(d.getDate() + diff - 7)
      dataFreq.setHours(12, 0, 0, 0)
      if (dataFreq < HOJE) datasFreq.push(dataFreq)
    }
  }

  const datasUnicas = [...new Map(datasFreq.map((d) => [d.getTime(), d])).values()]

  for (const dataFreq of datasUnicas) {
    for (const { id, raw } of alunosAtivos) {
      // 75% de presença
      const presente = Math.random() < 0.75
      try {
        await db.frequencia.create({
          data: {
            alunoId: id,
            data: dataFreq,
            presenca: presente ? "Presente" : "Ausente",
          },
        })
        freqTotal++
      } catch {
        // ignora duplicatas
      }
    }
  }
  console.log(`✓ ${freqTotal} registros de frequência`)

  // ── Custos ──────────────────────────────────────────────────────────────
  const custos = [
    { categoria: "Material Esportivo", descricao: "Bolas de futsal (10 unidades)", fornecedor: "Decathlon", valor: 890 },
    { categoria: "Manutenção",         descricao: "Reparo da rede do gol",         fornecedor: "Rede Esportes",  valor: 250 },
    { categoria: "Uniformes",          descricao: "Kits Sub-7 e Sub-9 (20 unid)",  fornecedor: "SportMania",    valor: 1200 },
    { categoria: "Alimentação",        descricao: "Lanche pós-treino Sub-7",       fornecedor: "Padaria Central", valor: 180 },
    { categoria: "Administrativo",     descricao: "Registro na FPF",               fornecedor: "Federação Paulista de Futsal", valor: 320 },
  ]

  for (const c of custos) {
    await db.custo.create({
      data: {
        ...c,
        formaPagamento: "PIX",
        data: subDays(HOJE, Math.floor(Math.random() * 60)),
        comprovante: Math.random() > 0.3,
      },
    })
  }
  console.log(`✓ ${custos.length} custos lançados`)

  // ── Notícias ────────────────────────────────────────────────────────────
  await db.noticia.createMany({
    data: [
      {
        titulo: "Inscrições abertas para a temporada!",
        subtitulo: "Vagas limitadas em todas as categorias. Venha fazer parte do time!",
        categoria: "Notícia",
        publicado: true,
        destaque: true,
        createdAt: subDays(HOJE, 10),
      },
      {
        titulo: "Sub-13 conquista 2º lugar no Torneio Verão",
        subtitulo: "Parabéns aos atletas da categoria Sub-13 pelo vice-campeonato!",
        categoria: "Resultado",
        publicado: true,
        destaque: false,
        createdAt: subDays(HOJE, 30),
      },
    ],
  })
  console.log("✓ 2 notícias publicadas")

  // ── Pré-matrículas ──────────────────────────────────────────────────────
  await db.preMatricula.createMany({
    data: [
      {
        nomeAluno: "Enzo Ribeiro Fonseca",
        dataNascimento: nascimento(ANO - 8),
        turma: "Sub-9",
        horario: "Ter/Qui 15h",
        nomeResponsavel: "Paulo Ribeiro Fonseca",
        email: "paulo.fonseca@email.com",
        telefone: "11998880001",
        observacoes: "Meu filho tem 8 anos e adoraria praticar futsal.",
      },
      {
        nomeAluno: "Miguel Torres Carvalho",
        dataNascimento: nascimento(ANO - 10),
        turma: "Sub-11",
        horario: "Seg/Qua 16h",
        nomeResponsavel: "Ana Torres Carvalho",
        email: "ana.carvalho2@email.com",
        telefone: "11998880002",
        observacoes: "Gostaria de informações sobre horários e mensalidade.",
      },
      {
        nomeAluno: "Samuel Nogueira Pinto",
        dataNascimento: nascimento(ANO - 12),
        turma: "Sub-13",
        horario: "Ter/Qui 17h",
        nomeResponsavel: "Jorge Nogueira Pinto",
        email: "jorge.pinto@email.com",
        telefone: "11998880003",
        observacoes: "O Samuel já treinou futsal em outro clube por 2 anos.",
      },
    ],
  })
  console.log("✓ 3 pré-matrículas pendentes")

  // ── Resultado ──────────────────────────────────────────────────────────
  console.log("\n✅  Demo pronto!\n")
  console.log("   Para rodar o app com os dados de demo:")
  console.log("   DATABASE_URL=file:./prisma/demo.db npm run dev")
  console.log("")
  console.log("   Login: admin / demo123")
  console.log("")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
