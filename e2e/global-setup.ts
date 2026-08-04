import { chromium } from "@playwright/test"
import path from "path"
import fs from "fs"
import { RESP_TESTE, ADMIN_TESTE } from "./test-credentials"
import { db } from "@/lib/db"
import bcryptjs from "bcryptjs"

export default async function globalSetup() {
  // ── 1. Cria admin de teste com senha conhecida ────────────────────────────
  // Garante que os testes E2E não dependem da senha do admin real no dev.db
  await db.usuario.upsert({
    where: { username: ADMIN_TESTE.username },
    update: { senha: bcryptjs.hashSync(ADMIN_TESTE.senha, 10), ativo: true },
    create: {
      username: ADMIN_TESTE.username,
      nome: ADMIN_TESTE.nome,
      senha: bcryptjs.hashSync(ADMIN_TESTE.senha, 10),
      role: ADMIN_TESTE.role,
      ativo: true,
    },
  })

  // ── 2. Cria responsável de teste no banco ─────────────────────────────────
  // Remove responsável de execuções anteriores para evitar conflito de email único
  await db.responsavel.deleteMany({ where: { email: RESP_TESTE.email } })

  // Usa um aluno exclusivo para que o portal não dependa dos dados reais do banco.
  await db.aluno.deleteMany({ where: { nome: "E2E Aluno Responsável" } })
  const aluno = await db.aluno.create({
    data: {
      nome: "E2E Aluno Responsável",
      dataNascimento: new Date(2015, 5, 15, 12),
      turma: "E2E Testes",
      horario: "Seg/Qua 08h",
      responsavel: RESP_TESTE.nome,
      telefone: "11999999999",
      email: RESP_TESTE.email,
      dataMatricula: new Date(),
      mensalidade: 150,
      status: "Ativo",
      avaliacoes: {
        create: {
          periodo: "E2E-1S",
          notaTecnica: 8,
          notaFisica: 7.5,
          notaComportamento: 9,
          frequencia: 90,
          observacoes: "Avaliação do portal E2E",
        },
      },
      uniformes: {
        create: { item: "Camisa", tamanho: "M", entregue: false },
      },
    },
  })

  await db.responsavel.create({
    data: {
      nome: RESP_TESTE.nome,
      email: RESP_TESTE.email,
      senha: bcryptjs.hashSync(RESP_TESTE.senha, 10),
      telefone: "11999999999",
      ativo: true,
      alunos: { connect: { id: aluno.id } },
    },
  })

  await db.$disconnect()

  // ── 2. Login pelo formulário e grava storageState ─────────────────────────
  const authDir = path.join(process.cwd(), "e2e", ".auth")
  fs.mkdirSync(authDir, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto("http://localhost:3000/responsavel/login")
  await page.fill('input[type="email"]', RESP_TESTE.email)
  await page.fill('input[type="password"]', RESP_TESTE.senha)
  await page.click('button[type="submit"]')
  // No primeiro acesso o Next em dev pode compilar o portal do responsável;
  // 15s tornava a suíte intermitente apesar de o login ter sido aceito.
  await page.waitForURL("**/responsavel", { timeout: 45_000, waitUntil: "domcontentloaded" })

  await context.storageState({ path: path.join(authDir, "responsavel.json") })
  await browser.close()
}
