import { test, expect } from "@playwright/test"

const RESP_STORAGE = "e2e/.auth/responsavel.json"

test.describe("Portal autenticado — calendário do aluno", () => {
  test.use({ storageState: RESP_STORAGE })

  test("portal: calendário abre, mostra o mês atual e navega de mês", async ({ page }) => {
    await page.goto("/responsavel/calendario")
    await expect(page.getByRole("heading", { name: /\p{L}+ de \d{4}/u, level: 1 })).toBeVisible()
    const proximo = page.getByRole("link", { name: "Próximo mês" })
    await expect(proximo).toBeVisible()
    await proximo.click()
    await expect(page).toHaveURL(/[?&]mes=\d{4}-\d{2}/)
    await expect(page.getByRole("link", { name: "Mês anterior" })).toBeVisible()
  })

  test("portal: ativa o feed .ics, baixa o calendário e o link some ao desativar", async ({ page, request }) => {
    await page.goto("/responsavel/calendario")
    const botao = page.getByRole("button", { name: /Adicionar ao calendário/ })
    if (await botao.isVisible()) await botao.click()

    const link = page.getByTestId("link-calendario")
    await expect(link).toContainText("/api/calendario/")
    const url = (await link.textContent())!.trim()

    // Calendários externos não enviam cookie: a requisição abaixo é anônima.
    const anonimo = await request.get(url, { headers: { cookie: "" } })
    expect(anonimo.status()).toBe(200)
    expect(anonimo.headers()["content-type"]).toContain("text/calendar")
    const corpo = await anonimo.text()
    expect(corpo).toContain("BEGIN:VCALENDAR")
    expect(corpo).toContain("BEGIN:VTIMEZONE")

    await page.getByRole("button", { name: /Mais opções/ }).click()
    await page.getByRole("button", { name: "Desativar link" }).click()
    await expect(page.getByRole("button", { name: /Adicionar ao calendário/ })).toBeVisible()
    const revogado = await request.get(url, { headers: { cookie: "" } })
    expect(revogado.status()).toBe(404)
  })

  test("feed com token inválido responde 404", async ({ request }) => {
    const r = await request.get("/api/calendario/0000.ics")
    expect(r.status()).toBe(404)
  })
})
