import { expect, test } from "@playwright/test"
import { loginAsAdmin } from "./helpers"
import { resetPagamentosE2E } from "./fixtures"

test.beforeEach(async ({ page }) => {
  await resetPagamentosE2E()
  await loginAsAdmin(page)
})

const ALUNO = "E2E Aluno Pagamentos 1"

async function abrirAluno(page: import("@playwright/test").Page) {
  await page.goto("/pagamentos")
  await page.getByRole("searchbox", { name: /buscar aluno ou responsável/i }).fill(ALUNO)
  await page.locator('[data-slot="lista-devedores"]').getByRole("link", { name: new RegExp(ALUNO) }).click()
  await expect(page.getByRole("region", { name: "Aluno" }).getByRole("heading", { name: ALUNO })).toBeVisible()
}

test.describe("Central — painel do aluno", () => {
  test("dá baixa de uma mensalidade e mostra o recibo emitido", async ({ page }) => {
    await abrirAluno(page)
    const painel = page.getByRole("region", { name: "Aluno" })
    await painel.getByRole("button", { name: /Dar baixa/i }).click()
    await expect(painel.getByText(/Baixa registrada/i)).toBeVisible({ timeout: 10000 })
    const imprimir = painel.getByRole("link", { name: /Imprimir PDF/i }).first()
    await expect(imprimir).toHaveAttribute("href", /\/recibos\?codigo=/)
  })

  test("baixa parcial com motivo deixa a mensalidade em aberto como 'parcial'", async ({ page }) => {
    await abrirAluno(page)
    const painel = page.getByRole("region", { name: "Aluno" })
    await painel.getByRole("button", { name: /Alterar valor/i }).click()
    await painel.getByLabel("Valor recebido").fill("50")
    await painel.getByLabel("Motivo").fill("Pagou metade")
    await painel.getByRole("button", { name: /Dar baixa/i }).click()
    await expect(painel.getByText(/Baixa registrada/i)).toBeVisible({ timeout: 10000 })
    await page.reload()
    await expect(page.locator('[data-slot="lista-devedores"]').getByText("paga em parte").first()).toBeVisible()
  })

  test("'Alterar valor' sem motivo não deixa confirmar", async ({ page }) => {
    await abrirAluno(page)
    const painel = page.getByRole("region", { name: "Aluno" })
    await painel.getByRole("button", { name: /Alterar valor/i }).click()
    await painel.getByLabel("Valor recebido").fill("50")
    await expect(painel.getByRole("button", { name: /Dar baixa/i })).toBeDisabled()
  })

  test("?aluno= inexistente mostra 'Aluno não encontrado' sem quebrar", async ({ page }) => {
    await page.goto("/pagamentos?aluno=99999999")
    await expect(page.getByText("Aluno não encontrado")).toBeVisible()
  })
})
