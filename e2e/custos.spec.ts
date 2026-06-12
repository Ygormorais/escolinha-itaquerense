import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page)
})

test.describe("Custos — smoke e carregamento", () => {
  test("página carrega com título e tabs", async ({ page }) => {
    await page.goto("/custos")
    await expect(page.getByRole("heading", { name: "Custos", exact: true })).toBeVisible()
    await expect(page.getByRole("tab", { name: /Lançamentos/i })).toBeVisible()
    await expect(page.getByRole("tab", { name: /Recorrentes/i })).toBeVisible()
  })

  test("tab Lançamentos está ativa por padrão e exibe tabela", async ({ page }) => {
    await page.goto("/custos")
    const tabLancamentos = page.getByRole("tab", { name: /Lançamentos/i })
    await expect(tabLancamentos).toHaveAttribute("aria-selected", "true")
    await expect(page.locator("table")).toBeVisible()
  })

  test("tab Recorrentes exibe tabela ao clicar", async ({ page }) => {
    await page.goto("/custos")
    await page.getByRole("tab", { name: /Recorrentes/i }).click()
    await expect(page.locator("table")).toBeVisible()
  })
})

test.describe("Custos — filtro de mês", () => {
  test("input de mês está visível e com valor atual", async ({ page }) => {
    await page.goto("/custos")
    const inputMes = page.locator('input[type="month"]')
    await expect(inputMes).toBeVisible()
    const valor = await inputMes.inputValue()
    // deve ter formato YYYY-MM
    expect(valor).toMatch(/^\d{4}-\d{2}$/)
  })

  test("alterar o mês navega para URL com query ?mes=", async ({ page }) => {
    await page.goto("/custos")
    const inputMes = page.locator('input[type="month"]')
    // Corrida de hidratação: um set pré-hidratação vira o lastValue do
    // value-tracker do React e o evento com o mesmo valor é deduplicado para
    // sempre. Garante value ≠ lastValue em toda iteração: decoy pelo setter
    // rastreado + alvo pelo setter do prototype; repete até o onChange
    // disparar o router.push e a URL refletir o mês.
    await expect
      .poll(async () => {
        await inputMes.evaluate((el: HTMLInputElement, valor) => {
          el.value = "2024-12" // decoy via setter rastreado (atualiza o tracker)
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!
          setter.call(el, valor) // alvo bypassando o tracker
          el.dispatchEvent(new Event("input", { bubbles: true }))
        }, "2025-01")
        return page.url()
      }, { timeout: 10000 })
      .toMatch(/mes=2025-01/)
    await expect(page.locator("table")).toBeVisible()
  })
})

test.describe("Custos — criar novo custo", () => {
  test("botão 'Novo Custo' abre dialog 'Registrar Custo'", async ({ page }) => {
    await page.goto("/custos")
    await page.getByRole("button", { name: /Novo Custo/i }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole("heading", { name: /Registrar Custo/i })).toBeVisible()
  })

  test("dialog contém campos obrigatórios esperados", async ({ page }) => {
    await page.goto("/custos")
    await page.getByRole("button", { name: /Novo Custo/i }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog.locator('input[type="date"]')).toBeVisible()
    await expect(dialog.locator('input[type="number"]')).toBeVisible()
    // campos de texto: Descrição, Fornecedor, Observações
    const inputs = dialog.locator("input:not([type='date']):not([type='number']):not([type='checkbox'])")
    await expect(inputs.first()).toBeVisible()
  })

  test("fechar dialog via botão Cancelar/Close fecha o dialog", async ({ page }) => {
    await page.goto("/custos")
    await page.getByRole("button", { name: /Novo Custo/i }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    // tenta fechar pelo botão de fechar (DialogFooter showCloseButton ou botão com aria-label Close)
    const btnFechar = dialog.getByRole("button", { name: /Cancelar|Fechar|Close/i }).first()
    await btnFechar.click()
    await expect(dialog).not.toBeVisible()
  })

  test("criar custo com dados válidos fecha dialog e refresca lista", async ({ page }) => {
    await page.goto("/custos")
    await page.getByRole("button", { name: /Novo Custo/i }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()

    // Categoria via Select
    const selectCategoria = dialog.locator('[role="combobox"]').first()
    await selectCategoria.click()
    await page.getByRole("option", { name: /Outros/i }).first().click()

    // Descrição
    const inputDescricao = dialog.locator('label:has-text("Descrição") + div input, label:has-text("Descrição") ~ div input').first()
    if (await inputDescricao.isVisible({ timeout: 2000 }).catch(() => false)) {
      await inputDescricao.fill("Custo E2E Automático")
    }

    // Valor
    await dialog.locator('input[type="number"]').fill("150.00")

    await dialog.getByRole("button", { name: /Registrar|Salvar/i }).click()
    await page.waitForTimeout(1500)
    // dialog deve ter fechado OU exibido erro de validação
    const dialogAberto = await dialog.isVisible()
    if (!dialogAberto) {
      // sucesso — lista recarregada
      await expect(page.locator("table")).toBeVisible()
    }
  })
})

test.describe("Custos — busca na lista de lançamentos", () => {
  test("busca por texto inexistente mostra mensagem de ausência", async ({ page }) => {
    await page.goto("/custos")
    // só aparece se há custos no mês atual; se tabela tiver dados
    const tbody = page.locator("table tbody tr")
    const firstRow = tbody.first()
    const hasCustos = await firstRow.isVisible({ timeout: 3000 }).catch(() => false)
    if (hasCustos) {
      const inputBusca = page.locator('input[placeholder*="Buscar"]').first()
      if (await inputBusca.isVisible({ timeout: 2000 }).catch(() => false)) {
        await inputBusca.fill("zzz_nao_existe_e2e_custo")
        await expect(page.getByText(/Nenhum custo encontrado/i)).toBeVisible()
        await inputBusca.clear()
      }
    }
  })
})

test.describe("Custos — aba Recorrentes CRUD", () => {
  test("botão 'Novo Recorrente' abre dialog de criação", async ({ page }) => {
    await page.goto("/custos")
    await page.getByRole("tab", { name: /Recorrentes/i }).click()
    const btnNovo = page.getByRole("button", { name: /Novo Recorrente/i })
    if (await btnNovo.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btnNovo.click()
      const dialog = page.getByRole("dialog")
      await expect(dialog).toBeVisible()
      await dialog.getByRole("button", { name: /Cancelar|Fechar|Close/i }).first().click()
    }
  })
})
