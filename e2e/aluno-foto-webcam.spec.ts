import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"
import { resetAlunosFluxosE2E } from "./fixtures"

// Câmera simulada do Chromium: sem hardware e sem pedido de permissão.
test.use({
  permissions: ["camera"],
  launchOptions: { args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] },
})

test.beforeEach(async ({ page }) => {
  await resetAlunosFluxosE2E()
  await loginAsAdmin(page)
})

test.describe("Foto do aluno pela webcam", () => {
  test("tira a foto, envia e remove", async ({ page }) => {
    await page.goto("/alunos")
    const href = await page.getByRole("link", { name: "E2E Aluno Fluxos Com Dados", exact: true }).getAttribute("href")
    expect(href).toMatch(/^\/alunos\/\d+$/)
    await page.goto(href!)

    // a ficha libera a câmera para a própria origem
    const resposta = await page.request.get(page.url())
    expect(resposta.headers()["permissions-policy"]).toContain("camera=(self)")

    const abrir = page.getByRole("button", { name: "Tirar foto", exact: true })
    // abre com retry: antes da hidratação o clique não faz nada
    await expect(async () => {
      await abrir.click()
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 1_000 })
    }).toPass({ timeout: 20_000 })

    const dialog = page.getByRole("dialog")
    await expect(dialog.getByRole("heading", { name: "Tirar foto do aluno" })).toBeVisible()
    const capturar = dialog.getByRole("button", { name: "Tirar foto", exact: true })
    await expect(capturar).toBeEnabled({ timeout: 15_000 })
    await capturar.click()

    await expect(dialog.getByAltText("Foto capturada")).toBeVisible()
    // refazer volta para o vídeo
    await dialog.getByRole("button", { name: "Tirar outra" }).click()
    await expect(capturar).toBeEnabled({ timeout: 15_000 })
    await capturar.click()

    const resp = page.waitForResponse((r) => r.url().endsWith("/api/upload/foto") && r.request().method() === "POST")
    await dialog.getByRole("button", { name: "Usar esta foto" }).click()
    expect((await resp).ok()).toBe(true)

    await expect(dialog).not.toBeVisible()
    await expect(page.getByAltText("Foto do aluno")).toBeVisible()

    // limpeza: remove a foto enviada
    await page.getByRole("button", { name: "Remover", exact: true }).click()
    await page.getByRole("button", { name: "Remover", exact: true }).last().click()
    await expect(page.getByAltText("Foto do aluno")).toHaveCount(0)
  })
})
