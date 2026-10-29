import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"
import { ANUNCIANTE_E2E, cliquesAnuncio, resetAnunciosE2E } from "./fixtures"

// PNG 1×1 válido: o upload confere os bytes do formato.
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
)

test.describe("Publicidade", () => {
  test.describe.configure({ mode: "serial" })

  test("banner no ar aparece na página inicial com rótulo e link de clique", async ({ page }) => {
    await resetAnunciosE2E()
    await page.goto("/", { waitUntil: "domcontentloaded" })
    // Com mais de um banner no ar o site sorteia um deles; vale qualquer anúncio.
    const banner = page.getByRole("complementary", { name: /^Publicidade: / })
    await expect(banner).toBeVisible()
    await expect(banner.getByText("Publicidade", { exact: true })).toBeVisible()
    await expect(banner.getByRole("link")).toHaveAttribute("href", /^\/api\/anuncio\/\d+$/)
    await expect(banner.getByRole("link")).toHaveAttribute("rel", /sponsored/)
  })

  test("clique conta e redireciona para o anunciante", async ({ request }) => {
    const anuncio = await resetAnunciosE2E()
    const res = await request.get(`/api/anuncio/${anuncio.id}`, { maxRedirects: 0 })
    expect(res.status()).toBe(302)
    expect(res.headers()["location"]).toBe("https://example.com/e2e-patrocinador")
    expect(await cliquesAnuncio(anuncio.id)).toBe(1)

    const inexistente = await request.get("/api/anuncio/999999", { maxRedirects: 0 })
    expect(inexistente.status()).toBe(302)
    expect(new URL(inexistente.headers()["location"]).pathname).toBe("/")
  })

  test("admin cadastra um anúncio com imagem enviada", async ({ page, playwright }) => {
    await resetAnunciosE2E()
    await loginAsAdmin(page)
    await page.goto("/configuracoes/publicidade")
    await expect(page.getByRole("heading", { name: "Publicidade" })).toBeVisible()
    await expect(page.getByText(`${ANUNCIANTE_E2E} Fixture`)).toBeVisible()

    await page.getByRole("button", { name: "Novo anúncio" }).first().click()
    const dialog = page.getByRole("dialog")
    await dialog.getByLabel("Anunciante").fill(`${ANUNCIANTE_E2E} Novo`)
    await dialog.getByLabel("Descrição do banner").fill("Oferta especial para as famílias")
    await dialog.getByLabel("Link").fill("https://example.com/novo")
    await dialog.getByLabel("Imagem do banner").setInputFiles({ name: "banner.png", mimeType: "image/png", buffer: PNG_1X1 })
    await dialog.getByRole("button", { name: "Criar anúncio" }).click()

    await expect(page.getByText("Anúncio criado")).toBeVisible()
    await expect(page.getByRole("heading", { name: `${ANUNCIANTE_E2E} Novo` })).toBeVisible()

    // A imagem precisa abrir para visitantes sem login (o banner é público).
    const src = await page.getByRole("img", { name: "Oferta especial para as famílias" }).getAttribute("src")
    expect(src).toMatch(/^\/uploads\/publicidade\//)
    const anonimo = await playwright.request.newContext({ baseURL: page.url() })
    const img = await anonimo.get(src!)
    expect(img.status()).toBe(200)
    expect(img.headers()["content-type"]).toBe("image/png")
    await anonimo.dispose()
  })
})
