import { expect, test } from "@playwright/test"
import QRCode from "qrcode"
import { loginAsAdmin } from "./helpers"

test.describe("Scanner de presença — mobile", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.setViewportSize({ width: 390, height: 844 })
  })

  test("mantém ações acessíveis e não estoura a largura", async ({ page }) => {
    await page.goto("/frequencia/scanner")

    await expect(page.getByRole("heading", { name: "Scanner de Presença" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Iniciar Scanner" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Ler QR por foto" })).toBeVisible()
    await expect(page.getByLabel("Selecionar foto do QR Code")).toHaveAttribute("capture", "environment")
    await expect(page.getByRole("link", { name: "Lançar presença manualmente" })).toBeVisible()

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })

  test("exibe orientação quando a câmera falha e permite tentar novamente", async ({ page }) => {
    await page.goto("/frequencia/scanner")
    await page.getByRole("button", { name: "Iniciar Scanner" }).click()

    const alerta = page.locator('[role="alert"].bg-danger-600')
    await expect(alerta).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole("button", { name: "Iniciar Scanner" })).toBeEnabled()
  })

  test("lê um QR válido a partir de foto sem usar a câmera ao vivo", async ({ page }) => {
    const qr = await QRCode.toBuffer("http://localhost:3000/qr/999999?h=assinatura-invalida", {
      type: "png",
      width: 640,
      margin: 4,
    })
    await page.goto("/frequencia/scanner")

    await page.getByLabel("Selecionar foto do QR Code").setInputFiles({
      name: "presenca.png",
      mimeType: "image/png",
      buffer: qr,
    })

    const retorno = page.locator('[role="alert"].bg-danger-600')
    await expect(retorno).toBeVisible({ timeout: 15_000 })
    await expect(retorno).not.toContainText("Não foi possível ler um QR Code nesta imagem")
    await expect(page.getByRole("button", { name: "Ler QR por foto" })).toBeEnabled()
  })
})
