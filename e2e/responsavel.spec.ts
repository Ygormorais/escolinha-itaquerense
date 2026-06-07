import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

// ── Testes sem autenticação (portal público) ───────────────────────────────

test.describe("Portal do Responsável — página de login", () => {
  test("carrega com heading e formulário", async ({ page }) => {
    await page.goto("/responsavel/login")
    await expect(page.getByRole("heading", { name: "Entrar", exact: true })).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test("botão submit desabilitado com campos vazios", async ({ page }) => {
    await page.goto("/responsavel/login")
    await expect(page.locator('button[type="submit"]')).toBeDisabled()
  })

  test("credenciais inválidas mostram mensagem de erro", async ({ page }) => {
    await page.goto("/responsavel/login")
    await page.fill('input[type="email"]', "naoexiste@teste.com")
    await page.fill('input[type="password"]', "senhaerrada")
    await page.click('button[type="submit"]')
    await expect(page.getByText(/incorretos/i)).toBeVisible({ timeout: 5000 })
  })

  test("link 'Esqueceu a senha?' existe e navega para recuperação", async ({ page }) => {
    await page.goto("/responsavel/login")
    await page.getByRole("link", { name: /Esqueceu/i }).click()
    await expect(page).toHaveURL("/responsavel/recuperar-senha")
  })
})

test.describe("Portal do Responsável — página de recuperação de senha", () => {
  test("carrega formulário de email", async ({ page }) => {
    await page.goto("/responsavel/recuperar-senha")
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test("botão de envio está presente", async ({ page }) => {
    await page.goto("/responsavel/recuperar-senha")
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })
})

// ── Testes com responsável criado via admin ────────────────────────────────

test.describe("Portal do Responsável — login com usuário real", () => {
  const emailTeste = `resp.e2e.${Date.now()}@escolinha.test`
  const senhaTeste = "SenhaE2E@123"

  test.beforeAll(async ({ request }) => {
    // Login como admin
    const loginRes = await request.post("/api/auth/login", {
      data: { username: "admin", password: "escolinha123" },
    })
    if (!loginRes.ok()) return

    // Cria responsável via endpoint interno (usa server action pelo formulário)
    // Como não há endpoint REST direto, verificamos apenas o fluxo de login com
    // credenciais de um responsável que possa existir no banco (seed)
  })

  test("responsável do seed não consegue logar com senha placeholder", async ({ page }) => {
    await page.goto("/responsavel/login")
    await page.fill('input[type="email"]', "resp.aluno1@teste.com")
    await page.fill('input[type="password"]', "seedPlaceholderHashNaoUsarParaLogin")
    await page.click('button[type="submit"]')
    await expect(page.getByText(/incorretos/i)).toBeVisible({ timeout: 5000 })
  })

  test("rota /responsavel sem sessão redireciona para login", async ({ page }) => {
    await page.goto("/responsavel")
    await expect(page).toHaveURL(/\/responsavel\/login/)
  })

  test("rotas protegidas do portal redirecionam sem sessão", async ({ page }) => {
    for (const rota of ["/responsavel/mensalidades", "/responsavel/frequencia", "/responsavel/boletim"]) {
      await page.goto(rota)
      await expect(page).toHaveURL(/\/responsavel\/login/, { timeout: 5000 })
    }
  })
})

// ── Testes do admin sobre responsáveis ────────────────────────────────────

test.describe("Admin — gerenciar responsáveis", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test("lista de responsáveis carrega", async ({ page }) => {
    await page.goto("/configuracoes/responsaveis")
    await expect(page.getByRole("heading", { name: /Responsáveis/i })).toBeVisible()
  })

  test("botão novo responsável abre dialog com campos", async ({ page }) => {
    await page.goto("/configuracoes/responsaveis")
    await page.getByRole("button", { name: /Novo|Adicionar/i }).first().click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('input[type="email"]')).toBeVisible()
    await dialog.getByRole("button", { name: /Cancelar/i }).click()
  })

  test("criar responsável e verificar na lista", async ({ page }) => {
    await page.goto("/configuracoes/responsaveis")
    await page.getByRole("button", { name: /Novo|Adicionar/i }).first().click()

    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    const nomeUnico = `Resp E2E ${Date.now()}`

    // O dialog usa <Label> sem htmlFor — preencher por posição/tipo de input
    const inputs = dialog.locator("input")
    await inputs.nth(0).fill(nomeUnico)             // Nome
    await inputs.nth(1).fill(`resp.${Date.now()}@e2e.test`) // Email
    await inputs.nth(2).fill("11999990001")          // Telefone
    // Senha é o último input de password
    await dialog.locator('input[type="password"]').fill("SenhaSegura@123")

    await dialog.getByRole("button", { name: /Criar|Salvar/i }).click()
    await expect(dialog).not.toBeVisible({ timeout: 10000 })
    await page.reload()
    await expect(page.getByText(nomeUnico)).toBeVisible()
  })
})
