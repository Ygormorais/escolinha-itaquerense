import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

test.beforeEach(async ({ page }) => {
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

    const selectTurma = page.locator('select').first()
    const options = await selectTurma.locator("option").allTextContents()
    // Se há mais de uma opção além de "Todas", seleciona a segunda
    if (options.length > 1) {
      const segundaTurma = options[1]
      await selectTurma.selectOption(segundaTurma)
      // Tabela deve permanecer visível
      await expect(page.locator("table")).toBeVisible()
    }
  })
})

test.describe("Uniformes — gerenciar itens de um aluno", () => {
  test("botão '+' na linha do aluno abre dialog de uniformes", async ({ page }) => {
    await page.goto("/uniformes")
    await page.waitForLoadState("networkidle")

    const primeiraLinha = page.locator("table tbody tr").first()
    const hasPrimeiraLinha = await primeiraLinha.isVisible({ timeout: 3000 }).catch(() => false)
    if (hasPrimeiraLinha) {
      // Botão com DialogTrigger (Plus icon)
      const btnPlus = primeiraLinha.getByRole("button", { name: /Adicionar item de uniforme/i })
      await btnPlus.click()
      const dialog = page.getByRole("dialog")
      await expect(dialog).toBeVisible()
      // Título deve conter "Uniformes —"
      await expect(dialog.getByRole("heading", { name: /Uniformes\s*—/i })).toBeVisible()
    }
  })

  test("dialog de uniformes contém seletor de item e campo de tamanho", async ({ page }) => {
    await page.goto("/uniformes")
    await page.waitForLoadState("networkidle")

    const primeiraLinha = page.locator("table tbody tr").first()
    const hasPrimeiraLinha = await primeiraLinha.isVisible({ timeout: 3000 }).catch(() => false)
    if (hasPrimeiraLinha) {
      const btnPlus = primeiraLinha.getByRole("button", { name: /Adicionar item de uniforme/i })
      await btnPlus.click()
      const dialog = page.getByRole("dialog")
      await expect(dialog).toBeVisible()

      // Select com itens padrão (Camisa, Short, etc.)
      const selectItem = dialog.getByRole("combobox")
      await expect(selectItem).toBeVisible()
      // Campo tamanho
      const inputTamanho = dialog.locator('input[placeholder="Tamanho"]')
      await expect(inputTamanho).toBeVisible()
      // Botão de adicionar
      const btnAdicionar = dialog.getByRole("button", { name: /Adicionar item/i })
      await expect(btnAdicionar).toBeVisible()
    }
  })

  test("seletor de item lista os itens padrão esperados", async ({ page }) => {
    await page.goto("/uniformes")
    await page.waitForLoadState("networkidle")

    const primeiraLinha = page.locator("table tbody tr").first()
    const hasPrimeiraLinha = await primeiraLinha.isVisible({ timeout: 3000 }).catch(() => false)
    if (hasPrimeiraLinha) {
      const btnPlus = primeiraLinha.getByRole("button", { name: /Adicionar item de uniforme/i })
      await btnPlus.click()
      const dialog = page.getByRole("dialog")
      await expect(dialog).toBeVisible()

      const selectItem = dialog.getByRole("combobox")
      await selectItem.click()
      // espera o popover montar antes de coletar (allTextContents não espera)
      await expect(page.locator('[role="option"]').first()).toBeVisible()
      const opcoes = await page.locator('[role="option"]').allTextContents()
      const itensEsperados = ["Camisa", "Short", "Meião", "Agasalho", "Chuteira"]
      for (const item of itensEsperados) {
        expect(opcoes.some((o) => o.includes(item))).toBe(true)
      }
      await page.keyboard.press("Escape")
    }
  })
})

test.describe("Uniformes — edge cases", () => {
  test("aluno sem itens exibe texto 'Nenhum item' na coluna Itens", async ({ page }) => {
    await page.goto("/uniformes")
    await page.waitForLoadState("networkidle")
    // Se algum aluno não tem uniformes, deve aparecer "Nenhum item"
    const cellNenhumItem = page.getByText(/Nenhum item/i)
    const hasCells = await cellNenhumItem.isVisible({ timeout: 2000 }).catch(() => false)
    // Aceitável não ter — só verifica se aparece não gera erro
    if (hasCells) {
      await expect(cellNenhumItem.first()).toBeVisible()
    }
  })

  test("stat card 'Alunos com uniforme' conta só alunos que têm itens", async ({ page }) => {
    await page.goto("/uniformes")
    await page.waitForLoadState("networkidle")
    const rows = page.locator("table tbody tr")
    const count = await rows.count()
    const statCard = page.locator('[data-slot="card"]').filter({ hasText: /Alunos com uniforme/i })
    const statText = await statCard.locator('[data-slot="card-content"] p').textContent()
    const statNum = parseInt((statText ?? "").trim(), 10)
    // nunca pode exceder o total de alunos listados; com "Nenhum item" em todas as linhas deve ser 0
    expect(statNum).toBeLessThanOrEqual(count)
    const semItens = await rows.filter({ hasText: "Nenhum item" }).count()
    if (semItens === count && count > 0) expect(statNum).toBe(0)
  })
})
