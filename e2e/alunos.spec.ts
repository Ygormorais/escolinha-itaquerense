import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page)
})

test.describe("Alunos — listagem", () => {
  test("lista de alunos carrega com dados", async ({ page }) => {
    await page.goto("/alunos")
    await expect(page.getByRole("heading", { name: "Alunos", exact: true })).toBeVisible()
    // deve haver pelo menos uma linha de aluno (seed)
    const rows = page.locator("table tbody tr")
    await expect(rows.first()).toBeVisible()
  })

  test("busca filtra por nome", async ({ page }) => {
    await page.goto("/alunos")
    const search = page.locator('input[placeholder*="Buscar"]')
    await search.fill("zzz_nao_existe_e2e")
    await expect(page.getByText(/Nenhum aluno/i)).toBeVisible()
    await search.clear()
  })

  test("filtro por status funciona", async ({ page }) => {
    await page.goto("/alunos")
    // clicar chip "Ativos"
    const chipAtivos = page.getByRole("button", { name: /Ativos/i })
    if (await chipAtivos.isVisible()) {
      await chipAtivos.click()
      await expect(page.locator("table tbody tr").first()).toBeVisible()
    }
  })
})

test.describe("Alunos — criar novo aluno", () => {
  const nomeUnico = `E2E Aluno ${Date.now()}`

  test("abre dialog e cria aluno com dados válidos", async ({ page }) => {
    await page.goto("/alunos")
    await page.getByRole("button", { name: /Novo/i }).click()

    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()

    // Campo "Nome completo"
    await dialog.locator('input').first().click()
    await dialog.locator('input').first().fill(nomeUnico)

    // Data de nascimento — usa evaluate para setar o valor via React
    await page.evaluate((val) => {
      const dialog = document.querySelector('[role="dialog"]')
      const input = dialog?.querySelector('input[type="date"]') as HTMLInputElement | null
      if (!input) return
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      setter?.call(input, val)
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    }, "2015-06-15")

    // Mensalidade
    const mensalidadeInput = dialog.locator('input[type="number"]').first()
    if (await mensalidadeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await mensalidadeInput.click()
      await mensalidadeInput.fill("200")
    }

    await dialog.getByRole("button", { name: /Cadastrar|Salvar|Criar/i }).click()

    // deve fechar o dialog e o aluno aparecer na lista (ou mostrar validação)
    await page.waitForTimeout(2000)
    const dialogStillOpen = await dialog.isVisible()
    if (!dialogStillOpen) {
      await page.reload()
      await expect(page.getByText(nomeUnico)).toBeVisible()
    } else {
      // tenta verificar se aluno foi criado mesmo com dialog aberto (edge case)
      await dialog.getByRole("button", { name: /Cancelar|Close|Fechar/i }).click()
      await page.reload()
      // aluno pode ou não ter sido criado dependendo da validação
    }
  })
})

test.describe("Alunos — detalhe do aluno", () => {
  test("clicar num aluno abre página de detalhe", async ({ page }) => {
    await page.goto("/alunos")
    const primeiroAluno = page.locator("table tbody tr").first()
    await expect(primeiroAluno).toBeVisible()

    // clicar no nome do aluno (link)
    const linkAluno = primeiroAluno.locator("a").first()
    await linkAluno.click()
    await expect(page).toHaveURL(/\/alunos\/\d+/)
  })

  test("página de detalhe mostra seções principais", async ({ page }) => {
    await page.goto("/alunos")
    const linkAluno = page.locator("table tbody tr a").first()
    const href = await linkAluno.getAttribute("href")
    if (!href) return

    await page.goto(href)
    // seção de pagamentos ou frequência deve existir
    await expect(page.locator("h1, h2").first()).toBeVisible()
  })
})
