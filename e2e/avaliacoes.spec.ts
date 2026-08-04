import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"
import { resetAlunosFluxosE2E } from "./fixtures"

test.beforeEach(async ({ page }) => {
  await resetAlunosFluxosE2E()
  await loginAsAdmin(page)
})

test.describe("Avaliações — smoke e carregamento", () => {
  test("página carrega com título 'Avaliações'", async ({ page }) => {
    await page.goto("/avaliacoes")
    await expect(page.getByRole("heading", { name: /Avalia[cç][oõ]es/i })).toBeVisible()
  })

  test("exibe contagem de avaliações registradas", async ({ page }) => {
    await page.goto("/avaliacoes")
    // "nenhuma avaliação registrada" / "1 avaliação registrada" / "N avaliações registradas"
    // contador do header + empty state da tabela podem casar juntos
    await expect(page.getByText(/avalia[cç](ão|ões) registradas?/i).first()).toBeVisible()
  })

  test("tabela com colunas corretas é visível", async ({ page }) => {
    await page.goto("/avaliacoes")
    await expect(page.locator("table")).toBeVisible()
    await expect(page.getByRole("columnheader", { name: /Aluno/i })).toBeVisible()
    await expect(page.getByRole("columnheader", { name: /Turma/i })).toBeVisible()
    await expect(page.getByRole("columnheader", { name: /Per[ií]odo/i })).toBeVisible()
    await expect(page.getByRole("columnheader", { name: /Nota T[eé]cnica/i })).toBeVisible()
  })
})

test.describe("Avaliações — criar nova avaliação", () => {
  test("botão '+ Nova Avaliação' abre dialog", async ({ page }) => {
    await page.goto("/avaliacoes")
    await page.getByRole("button", { name: /Nova Avalia[cç][aã]o/i }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole("heading", { name: /Nova Avalia[cç][aã]o/i })).toBeVisible()
  })

  test("dialog contém campos obrigatórios: Aluno, Período e notas", async ({ page }) => {
    await page.goto("/avaliacoes")
    await page.getByRole("button", { name: /Nova Avalia[cç][aã]o/i }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    // Select de aluno
    await expect(dialog.locator('[role="combobox"]')).toBeVisible()
    // Campo período
    await expect(dialog.locator('input[placeholder="2026-1S"]')).toBeVisible()
    // Campos numéricos (notas)
    const numericInputs = dialog.locator('input[type="number"]')
    await expect(numericInputs.first()).toBeVisible()
  })

  test("submeter dialog sem aluno selecionado exibe erro de validação", async ({ page }) => {
    await page.goto("/avaliacoes")
    await page.getByRole("button", { name: /Nova Avalia[cç][aã]o/i }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()

    // Clica em Cadastrar sem selecionar aluno
    await dialog.getByRole("button", { name: /Cadastrar/i }).click()

    await expect(dialog.locator("p").filter({ hasText: /^Selecione um aluno$/ })).toBeVisible()

    // Fechar dialog
    const btnFechar = dialog.getByRole("button", { name: /Cancelar|Fechar|Close/i }).first()
    await expect(btnFechar).toBeVisible()
    await btnFechar.click()
    await expect(dialog).not.toBeVisible()
  })

  test("fechar dialog descarta o formulário", async ({ page }) => {
    await page.goto("/avaliacoes")
    await page.getByRole("button", { name: /Nova Avalia[cç][aã]o/i }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()

    // Preencher campo período
    await dialog.locator('input[placeholder="2026-1S"]').fill("2025-2S")

    // Fechar
    const btnFechar = dialog.getByRole("button", { name: /Cancelar|Fechar|Close/i }).first()
    await btnFechar.click()
    await expect(dialog).not.toBeVisible()
  })
})

test.describe("Avaliações — tabela com dados", () => {
  test("fixture de avaliação aparece na tabela", async ({ page }) => {
    await page.goto("/avaliacoes")
    const aluno = page.getByRole("link", { name: "E2E Aluno Fluxos Com Dados", exact: true })
    const linha = page.getByRole("row").filter({ has: aluno })
    await expect(linha).toBeVisible()
    await expect(linha.getByRole("cell", { name: "2026-1S", exact: true })).toBeVisible()
  })

  test("avaliação controlada exibe badges de nota", async ({ page }) => {
    await page.goto("/avaliacoes")
    const aluno = page.getByRole("link", { name: "E2E Aluno Fluxos Com Dados", exact: true })
    const linha = page.getByRole("row").filter({ has: aluno })
    await expect(linha).toBeVisible()
    await expect(linha.getByText("8.0", { exact: true })).toBeVisible()
    await expect(linha.getByText("88%", { exact: true })).toBeVisible()
  })
})

test.describe("Avaliações — ações na tabela", () => {
  test("botão de editar abre dialog 'Editar Avaliação'", async ({ page }) => {
    await page.goto("/avaliacoes")
    await page.waitForLoadState("networkidle")

    const aluno = page.getByRole("link", { name: "E2E Aluno Fluxos Com Dados", exact: true })
    const linha = page.getByRole("row").filter({ has: aluno })
    const btnEditar = linha.getByRole("button", { name: "Editar avaliação", exact: true })
    await expect(btnEditar).toBeVisible()
    await btnEditar.click()
    const dialog = page.getByRole("dialog")
    await expect(dialog.getByRole("heading", { name: /Editar Avalia[cç][aã]o/i })).toBeVisible()
    await dialog.getByRole("button", { name: /Cancelar|Fechar|Close/i }).first().click()
    await expect(dialog).not.toBeVisible()
  })
})
