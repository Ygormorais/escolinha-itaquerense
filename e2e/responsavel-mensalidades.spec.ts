import { test, expect } from "@playwright/test"
import { prepararMensalidadesPortalE2E } from "./fixtures"

const RESP_STORAGE = "e2e/.auth/responsavel.json"

test.describe("Portal do Responsável — mensalidades e recibos", () => {
  test.use({ storageState: RESP_STORAGE })
  test.describe.configure({ mode: "serial" })

  let dados: Awaited<ReturnType<typeof prepararMensalidadesPortalE2E>>

  test.beforeAll(async () => {
    dados = await prepararMensalidadesPortalE2E()
  })

  test("mostra pago, pago em parte com o que falta e links de recibo", async ({ page }) => {
    await page.goto("/responsavel/mensalidades")
    const ano = new Date().getFullYear()
    const janeiro = page.locator(`[data-mes="${ano}-01"]`)
    await expect(janeiro.getByText("Pago", { exact: true })).toBeVisible()
    await expect(janeiro.getByText(/Pix · pago em 08\/01\//)).toBeVisible()
    await expect(janeiro.getByRole("link", { name: /Recibo E2E-PORTAL-.* · R\$\s?150,00/ })).toBeVisible()

    if (dados.temParcial) {
      const atual = page.locator(`[data-mes="${dados.mes}"]`)
      await expect(atual.getByText("Pago em parte")).toBeVisible()
      await expect(atual.getByText(/Recebido R\$\s?50,00 · falta R\$\s?100,00/)).toBeVisible()
      await expect(atual.getByRole("link", { name: /Recibo .* · R\$\s?50,00/ })).toBeVisible()
    }
  })

  test("abre o recibo com dados, QR de validação e botão de imprimir", async ({ page }) => {
    await page.goto("/responsavel/mensalidades")
    const ano = new Date().getFullYear()
    await page.locator(`[data-mes="${ano}-01"]`).getByRole("link", { name: /Recibo/ }).click()
    await expect(page).toHaveURL(`/responsavel/recibos/${dados.reciboJaneiro}`)
    await expect(page.getByRole("heading", { name: "Recibo" })).toBeVisible()
    await expect(page.getByText("E2E Aluno Responsável").first()).toBeVisible()
    await expect(page.getByLabel("QR code de validação do recibo")).toBeVisible()
    await expect(page.getByRole("button", { name: /Imprimir ou salvar PDF/ })).toBeVisible()
  })

  test("recibo de outra família não abre", async ({ page }) => {
    // Com streaming (loading.tsx) o Next responde 200 e renderiza o not-found; checamos o conteúdo.
    await page.goto(`/responsavel/recibos/${dados.reciboAlheio}`)
    await expect(page.getByRole("heading", { name: /Página não encontrada/i })).toBeVisible()
    await expect(page.getByText("E2E Portal Outra Família")).toHaveCount(0)
  })

  test("declaração anual soma também a baixa parcial", async ({ page }) => {
    await page.goto("/responsavel/mensalidades")
    await page.getByRole("link", { name: "Declaração anual" }).first().click()
    const total = page.getByRole("row", { name: /Total no ano/ })
    // Janeiro quitado (150) + parcial do mês atual (50), quando o mês atual não é janeiro.
    await expect(total).toContainText(dados.temParcial ? /R\$\s?200,00/ : /R\$\s?150,00/)
  })
})
