import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"
import { resetAlunosFluxosE2E } from "./fixtures"

test.beforeEach(async ({ page }) => {
  await resetAlunosFluxosE2E()
  await loginAsAdmin(page)
})

test.describe("Uniformes — smoke e carregamento", () => {
  test("página carrega com título 'Uniformes'", async ({ page }) => {
    await page.goto("/uniformes")
    await expect(page.getByRole("heading", { name: "Uniformes", exact: true })).toBeVisible()
  })

  test("exibe os três stat cards de resumo", async ({ page }) => {
    await page.goto("/uniformes")
    await expect(page.getByText(/Alunos com uniforme/i)).toBeVisible()
    await expect(page.getByText(/Itens entregues/i)).toBeVisible()
    await expect(page.getByText(/Itens pendentes/i)).toBeVisible()
  })

  test("tabela com colunas corretas é visível", async ({ page }) => {
    await page.goto("/uniformes")
    await expect(page.locator("table")).toBeVisible()
    await expect(page.getByRole("columnheader", { name: /Aluno/i })).toBeVisible()
    await expect(page.getByRole("columnheader", { name: /Turma/i })).toBeVisible()
    await expect(page.getByRole("columnheader", { name: /Itens/i })).toBeVisible()
    await expect(page.getByRole("columnheader", { name: /Status/i })).toBeVisible()
  })
})

test.describe("Uniformes — filtros", () => {
  test("campo de busca por aluno está visível", async ({ page }) => {
    await page.goto("/uniformes")
    const inputBusca = page.locator('input[placeholder*="Buscar aluno"]')
    await expect(inputBusca).toBeVisible()
  })

  test("busca por nome inexistente exibe 'Nenhum aluno encontrado'", async ({ page }) => {
    await page.goto("/uniformes")
    const inputBusca = page.locator('input[placeholder*="Buscar aluno"]')
    await inputBusca.fill("zzz_nao_existe_e2e_uniforme")
    await expect(page.getByText(/Nenhum aluno encontrado/i)).toBeVisible()
    await inputBusca.clear()
  })

  test("seletor de turma está visível e tem opção 'Todas as turmas'", async ({ page }) => {
    await page.goto("/uniformes")
    const selectTurma = page.getByRole("combobox", { name: /Filtrar por turma/i })
    await expect(selectTurma).toBeVisible()
    await selectTurma.click()
    await expect(page.getByRole("option", { name: /Todas as turmas/i })).toBeVisible()
    await page.keyboard.press("Escape")
  })

  test("filtrar por turma específica atualiza a tabela", async ({ page }) => {
    await page.goto("/uniformes")
    await page.waitForLoadState("networkidle")

    const selectTurma = page.getByRole("combobox", { name: /Filtrar por turma/i })
    await selectTurma.click()
    await page.getByRole("option", { name: "E2E Testes", exact: true }).click()
    await expect(page.getByRole("link", { name: "E2E Aluno Fluxos Com Dados", exact: true })).toBeVisible()
    await expect(page.getByRole("link", { name: "E2E Aluno Fluxos Sem Itens", exact: true })).toBeVisible()
  })
})

test.describe("Uniformes — gerenciar itens de um aluno", () => {
  test("botão '+' na linha do aluno abre dialog de uniformes", async ({ page }) => {
    await page.goto("/uniformes")
    await page.waitForLoadState("networkidle")

    const aluno = page.getByRole("link", { name: "E2E Aluno Fluxos Com Dados", exact: true })
    const linha = page.getByRole("row").filter({ has: aluno })
    const btnPlus = linha.getByRole("button", { name: /Adicionar item de uniforme/i })
    await btnPlus.click()
    const dialog = page.getByRole("dialog")
    await expect(dialog.getByRole("heading", { name: /Uniformes\s*— E2E Aluno Fluxos Com Dados/i })).toBeVisible()
  })

  test("dialog de uniformes contém seletor de item e campo de tamanho", async ({ page }) => {
    await page.goto("/uniformes")
    await page.waitForLoadState("networkidle")

    const aluno = page.getByRole("link", { name: "E2E Aluno Fluxos Com Dados", exact: true })
    const linha = page.getByRole("row").filter({ has: aluno })
    await linha.getByRole("button", { name: /Adicionar item de uniforme/i }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()

    const selectItem = dialog.getByRole("combobox")
    await expect(selectItem).toBeVisible()
    await expect(dialog.locator('input[placeholder="Tamanho"]')).toBeVisible()
    await expect(dialog.getByRole("button", { name: /Adicionar item/i })).toBeVisible()
  })

  test("seletor de item lista os itens padrão esperados", async ({ page }) => {
    await page.goto("/uniformes")
    await page.waitForLoadState("networkidle")

    const aluno = page.getByRole("link", { name: "E2E Aluno Fluxos Com Dados", exact: true })
    const linha = page.getByRole("row").filter({ has: aluno })
    await linha.getByRole("button", { name: /Adicionar item de uniforme/i }).click()
    const dialog = page.getByRole("dialog")
    const selectItem = dialog.getByRole("combobox")
    await selectItem.click()
    await expect(page.locator('[role="option"]').first()).toBeVisible()
    const opcoes = await page.locator('[role="option"]').allTextContents()
    const itensEsperados = ["Camisa", "Short", "Meião", "Agasalho", "Chuteira"]
    for (const item of itensEsperados) {
      expect(opcoes.some((o) => o.includes(item))).toBe(true)
    }
    await page.keyboard.press("Escape")
  })
})

test.describe("Uniformes — edge cases", () => {
  test("aluno sem itens exibe texto 'Nenhum item' na coluna Itens", async ({ page }) => {
    await page.goto("/uniformes")
    await page.waitForLoadState("networkidle")
    const aluno = page.getByRole("link", { name: "E2E Aluno Fluxos Sem Itens", exact: true })
    const linha = page.getByRole("row").filter({ has: aluno })
    await expect(linha.getByText("Nenhum item", { exact: true })).toBeVisible()
  })

  test("stat card 'Alunos com uniforme' conta só alunos que têm itens", async ({ page }) => {
    await page.goto("/uniformes")
    await page.waitForLoadState("networkidle")
    const rows = page.locator("table tbody tr")
    const count = await rows.count()
    const statCard = page.locator('[data-slot="card"]').filter({ hasText: /Alunos com uniforme/i })
    const statText = await statCard.locator('[data-slot="card-content"] p').textContent()
    const statNum = parseInt((statText ?? "").trim(), 10)
    expect(statNum).toBeGreaterThanOrEqual(1)
    // nunca pode exceder o total de alunos listados; com "Nenhum item" em todas as linhas deve ser 0
    expect(statNum).toBeLessThanOrEqual(count)
    const semItens = await rows.filter({ hasText: "Nenhum item" }).count()
    if (semItens === count && count > 0) expect(statNum).toBe(0)
  })
})
