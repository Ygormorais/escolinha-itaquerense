import { test, expect } from "@playwright/test"

const PAGINAS = [
  { path: "/horarios", titulo: "Turmas e horários — Escolinha Itaquerense" },
  { path: "/matricula", titulo: "Pré-matrícula — Escolinha Itaquerense" },
  { path: "/partidas", titulo: "Partidas e resultados — Escolinha Itaquerense" },
  { path: "/noticias/publico", titulo: "Notícias — Escolinha Itaquerense" },
  { path: "/privacidade", titulo: "Política de Privacidade — Escolinha Itaquerense" },
  { path: "/termos", titulo: "Termos de Uso — Escolinha Itaquerense" },
]

test.describe("SEO das páginas públicas", () => {
  for (const { path, titulo } of PAGINAS) {
    test(`${path}: título sem sufixo duplicado, canonical e descrição própria`, async ({ page }) => {
      await page.goto(path)
      await expect(page).toHaveTitle(titulo)
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href")
      expect(new URL(canonical!).pathname).toBe(path)
      const descricao = await page.locator('meta[name="description"]').getAttribute("content")
      expect(descricao!.length).toBeGreaterThan(60)
      // prévia de compartilhamento 1200x630
      await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute("content", "1200")
      await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute("content", "630")
    })
  }

  test("home tem título próprio, canonical e JSON-LD SportsClub; outras páginas não repetem o bloco", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveTitle(/Escolinha de Futsal em Itaquera/)
    const bruto = await page.locator("script#site-jsonld").textContent()
    const ld = JSON.parse(bruto!)
    expect(ld["@type"]).toContain("SportsClub")
    expect(ld.address.streetAddress).toBeTruthy()
    expect(ld.image).toMatch(/^https?:\/\//)

    await page.goto("/privacidade")
    await expect(page.locator("script#site-jsonld")).toHaveCount(0)
  })

  test("imagem de prévia é um PNG leve", async ({ request }) => {
    const resposta = await request.get("/opengraph-image")
    expect(resposta.status()).toBe(200)
    expect(resposta.headers()["content-type"]).toContain("image/png")
    expect((await resposta.body()).length).toBeLessThan(300 * 1024)
  })

  test("cabeçalhos de segurança: CSP em Report-Only e COOP, HSTS sem preload", async ({ request }) => {
    const h = (await request.get("/")).headers()
    expect(h["content-security-policy-report-only"]).toContain("frame-ancestors 'none'")
    expect(h["content-security-policy"]).toBeUndefined()
    expect(h["cross-origin-opener-policy"]).toBe("same-origin")
    expect(h["strict-transport-security"]).not.toMatch(/preload/i)
  })
})

test.describe("Acessibilidade e contato do site público", () => {
  for (const path of ["/", "/horarios", "/partidas"]) {
    test(`${path}: um único link para pular ao conteúdo, que leva ao <main>`, async ({ page }) => {
      await page.goto(path)
      const skip = page.getByRole("link", { name: /Pular para o conteúdo|Ir para o conteúdo/ })
      await expect(skip).toHaveCount(1)
      await page.keyboard.press("Tab")
      await expect(skip).toBeFocused()
      await page.keyboard.press("Enter")
      await expect(page.locator("main")).toBeFocused()
    })
  }

  test("foco do teclado fica visível nas páginas que não têm estilo próprio", async ({ page }) => {
    await page.goto("/termos")
    const link = page.locator("main a").first()
    await link.focus()
    const contorno = await link.evaluate((el) => getComputedStyle(el).outlineStyle)
    expect(contorno).not.toBe("none")
  })

  test("/horarios e o rodapé oferecem Como chegar pelo Google Maps e pelo Waze", async ({ page }) => {
    await page.goto("/horarios")
    await expect(page.getByRole("heading", { name: "Como chegar" })).toBeVisible()
    const maps = page.getByRole("link", { name: /Google Maps/ })
    const waze = page.getByRole("link", { name: /Waze/ })
    await expect(maps.first()).toHaveAttribute("href", /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=/)
    await expect(waze.first()).toHaveAttribute("href", /^https:\/\/waze\.com\/ul\?/)
    await expect(maps.first()).toHaveAttribute("rel", /noopener/)
  })

  test("sem rolagem horizontal em 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 })
    for (const path of ["/", "/horarios", "/matricula"]) {
      await page.goto(path)
      const sobra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(sobra, path).toBeLessThanOrEqual(0)
    }
  })
})
