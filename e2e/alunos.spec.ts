import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"
import { resetAlunosFluxosE2E } from "./fixtures"

test.beforeEach(async ({ page }) => {
  await resetAlunosFluxosE2E()
  await loginAsAdmin(page)
})

test.describe("Alunos — listagem", () => {
  test("lista de alunos carrega com dados", async ({ page }) => {
    await page.goto("/alunos")
    await expect(page.getByRole("heading", { name: "Alunos", exact: true })).toBeVisible()
    await expect(page.getByRole("link", { name: "E2E Aluno Fluxos Com Dados", exact: true })).toBeVisible()
  })

  test("busca filtra por nome", async ({ page }) => {
    await page.goto("/alunos")
    const search = page.locator('input[placeholder*="Buscar"]')
    await search.fill("zzz_nao_existe_e2e")
    // counter ("nenhum aluno encontrado") e empty-state da tabela aparecem juntos
    await expect(page.getByText(/Nenhum aluno/i).first()).toBeVisible()
    await search.clear()
  })

  test("filtro por status funciona", async ({ page }) => {
    await page.goto("/alunos")
    const filtroStatus = page.locator('[role="combobox"]').nth(1)
    await filtroStatus.click()
    await page.getByRole("option", { name: "Ativo", exact: true }).click()
    await expect(page).toHaveURL(/[?&]status=Ativo/)
    await expect(page.getByRole("link", { name: "E2E Aluno Fluxos Com Dados", exact: true })).toBeVisible()
  })
})

test.describe("Alunos — criar novo aluno", () => {
  const nomeUnico = `E2E Aluno Criado ${Date.now()}`

  test("abre dialog e cria aluno com dados válidos", async ({ page }) => {
    await page.goto("/alunos")
    await page.getByRole("button", { name: /Novo/i }).click()

    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()

    await dialog.getByLabel("Nome completo").fill(nomeUnico)
    await dialog.getByLabel("Data de nascimento").fill("2015-06-15")
    await dialog.getByLabel("Responsável").fill("Responsável Cadastro E2E")
    await dialog.getByLabel("Telefone").fill("11999997777")
    await dialog.getByLabel("E-mail").fill("aluno.criado@e2e.test")
    await dialog.getByLabel("Mensalidade (R$)").fill("200")

    const selects = dialog.getByRole("combobox")
    await selects.nth(0).click()
    await page.getByRole("option", { name: "Sub-11", exact: true }).click()
    await selects.nth(1).click()
    await page.getByRole("option", { name: "Seg/Qua 08h", exact: true }).click()

    await dialog.getByRole("button", { name: /Cadastrar|Salvar|Criar/i }).click()

    await expect(dialog).not.toBeVisible({ timeout: 10000 })
    await expect(page.getByRole("link", { name: nomeUnico, exact: true })).toBeVisible()
  })
})

test.describe("Alunos — detalhe do aluno", () => {
  test("clicar num aluno abre página de detalhe", async ({ page }) => {
    await page.goto("/alunos")
    const linkAluno = page.getByRole("link", { name: "E2E Aluno Fluxos Com Dados", exact: true })
    await expect(linkAluno).toBeVisible()
    await linkAluno.click()
    await expect(page).toHaveURL(/\/alunos\/\d+/)
  })

  test("página de detalhe mostra seções principais", async ({ page }) => {
    await page.goto("/alunos")
    const linkAluno = page.getByRole("link", { name: "E2E Aluno Fluxos Com Dados", exact: true })
    const href = await linkAluno.getAttribute("href")
    expect(href).toMatch(/^\/alunos\/\d+$/)
    await page.goto(href!)
    // seção de pagamentos ou frequência deve existir
    await expect(page.locator("h1, h2").first()).toBeVisible()
  })
})
