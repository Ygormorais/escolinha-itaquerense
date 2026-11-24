import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"
import { resetAulaExperimentalE2E } from "./fixtures"

test.describe("Aula experimental — site público", () => {
  test.beforeEach(async () => {
    await resetAulaExperimentalE2E()
  })

  test("página pública carrega sem login, com título e datas", async ({ page }) => {
    await page.goto("/aula-experimental")
    await expect(page.locator("h1")).toContainText("Aula experimental")
    await expect(page.getByRole("group", { name: /Escolha a data da aula/ })).toBeVisible()
  })

  test("data lotada fica desabilitada e avisa", async ({ page }) => {
    await page.goto("/aula-experimental")
    await expect(page.getByRole("radio", { name: /Lotada/ })).toBeDisabled()
  })

  test("envio vazio destaca os campos e mostra o erro da data", async ({ page }) => {
    await page.goto("/aula-experimental")
    await page.waitForLoadState("networkidle")
    await page.getByRole("button", { name: "Agendar aula experimental" }).click()
    await expect(page.locator("#erro-janela")).toHaveText("Escolha a data da aula.")
    await expect(page.locator("#erro-atleta")).toBeVisible()
    await expect(page.locator("#erro-consentimento")).toBeVisible()
  })

  test("agendamento completo mostra a confirmação com link .ics", async ({ page }) => {
    await page.goto("/aula-experimental")
    // aguarda hidratação para o handler JS de submit estar ativo
    await page.waitForLoadState("networkidle")
    await page.getByRole("radio", { name: /vagas|vaga/ }).first().check({ force: true })
    await page.fill("#atleta", `E2E Atleta ${Date.now()}`)
    await page.fill("#dataNasc", "15062015")
    await page.fill("#responsavel", "Responsável E2E Aula")
    await page.fill("#telefone", "(11) 98888-7777")
    // Anti-robô do servidor (produção): descarta envio em menos de 3 s após abrir o formulário.
    await page.waitForTimeout(3100)
    await page.getByRole("checkbox").check()
    await page.getByRole("button", { name: "Agendar aula experimental" }).click()
    await expect(page.getByRole("heading", { name: "Aula agendada!" })).toBeVisible({ timeout: 10000 })
    const ics = page.getByRole("link", { name: /Salvar no calendário/ })
    await expect(ics).toHaveAttribute("href", /\/aula-experimental\/ics\/\d+$/)
    const resposta = await page.request.get((await ics.getAttribute("href"))!)
    expect(resposta.status()).toBe(200)
    expect(resposta.headers()["content-type"]).toContain("text/calendar")
    expect(await resposta.text()).toContain("BEGIN:VEVENT")
  })

  test(".ics de data inexistente responde 404", async ({ request }) => {
    const resposta = await request.get("/aula-experimental/ics/99999999")
    expect(resposta.status()).toBe(404)
  })
})

test.describe("Aula experimental — admin", () => {
  test.beforeEach(async () => {
    await resetAulaExperimentalE2E()
  })

  test("lista inscrições, mostra WhatsApp e converte em pré-matrícula", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto("/configuracoes/aula-experimental")
    await expect(page.getByRole("heading", { name: "Aula experimental", level: 1 })).toBeVisible()
    const item = page.getByRole("listitem").filter({ hasText: "E2E Atleta Convertido" })
    await expect(item.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute("href", /wa\.me\/5511999990000/)
    await item.getByRole("button", { name: /Converter em pré-matrícula/ }).click()
    await page.getByRole("button", { name: "Converter", exact: true }).click()
    await expect(item.getByText("Convertida")).toBeVisible({ timeout: 10000 })
    await page.goto("/configuracoes/matriculas")
    await expect(page.getByText("E2E Atleta Convertido").first()).toBeVisible()
  })
})
