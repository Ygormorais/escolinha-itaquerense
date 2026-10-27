import { test, expect, type Page } from "@playwright/test"

async function abrirLanding(page: Page) {
  await page.goto("/", { waitUntil: "networkidle" })
  await expect(page.locator(".hs")).toBeVisible()
}

test.describe("Landing — topo e hero", () => {
  test("abre no topo da página, sem rolar sozinha até as abas de notícias", async ({ page }) => {
    await abrirLanding(page)
    await page.waitForTimeout(1500)
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
  })

  test("hero mostra o destaque institucional e só ele está ativo", async ({ page }) => {
    await abrirLanding(page)
    await expect(page.getByRole("heading", { level: 1, name: "Formação de base com paixão itaquerense" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Ver turmas e horários" })).toBeVisible()
    // Slides fora de vista não recebem foco por teclado nem leitor de tela (inert).
    await expect(page.locator(".hs-slide[inert]")).toHaveCount((await page.locator(".hs-slide").count()) - 1)
  })

  test("setas, abas e teclado trocam o destaque", async ({ page }) => {
    await abrirLanding(page)
    const proximo = page.getByRole("button", { name: "Próximo destaque" })
    const titulo2 = page.getByRole("heading", { level: 2, name: "Campeões mundiais Sub-13 em 2012" })

    await proximo.click()
    await expect(titulo2).toBeVisible()
    await expect(page.getByRole("link", { name: "Conhecer a história" })).toBeVisible()

    await page.getByRole("button", { name: /Ir para o destaque 1/ }).click()
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()

    await page.getByRole("button", { name: "Destaque anterior" }).focus()
    await page.keyboard.press("ArrowRight")
    await expect(titulo2).toBeVisible()
    await page.keyboard.press("ArrowLeft")
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  })

  test("a aba ativa fica marcada para tecnologia assistiva", async ({ page }) => {
    await abrirLanding(page)
    await expect(page.getByRole("button", { name: /Ir para o destaque 1/ })).toHaveAttribute("aria-current", "true")
    await page.getByRole("button", { name: "Próximo destaque" }).click()
    await expect(page.getByRole("button", { name: /Ir para o destaque 2/ })).toHaveAttribute("aria-current", "true")
    await expect(page.getByRole("button", { name: /Ir para o destaque 1/ })).not.toHaveAttribute("aria-current", "true")
  })

  for (const width of [1240, 1280, 1440, 1920]) {
    test(`o escudo do cabeçalho não encosta nos itens do menu em ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await abrirLanding(page)
      const escudo = await page.locator(".crest").boundingBox()
      expect(escudo).not.toBeNull()
      const links = page.locator("nav.main a:visible")
      const total = await links.count()
      expect(total).toBeGreaterThanOrEqual(5)
      for (let i = 0; i < total; i++) {
        const caixa = await links.nth(i).boundingBox()
        expect(caixa).not.toBeNull()
        const sobrepoe = caixa!.x < escudo!.x + escudo!.width && caixa!.x + caixa!.width > escudo!.x
        expect(sobrepoe, `item ${i} do menu sobrepõe o escudo`).toBe(false)
      }
    })
  }

  test("abaixo de 1240px o menu vira gaveta e abre pelo botão", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 })
    await abrirLanding(page)
    const botao = page.getByRole("button", { name: "Menu" })
    await expect(botao).toHaveAttribute("aria-expanded", "false")
    await botao.click()
    await expect(page.locator("nav.main.open")).toHaveCount(1)
    await expect(page.locator("nav.main").getByRole("link", { name: "Turmas" })).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(page.locator("nav.main.open")).toHaveCount(0)
    await expect(page.getByRole("button", { name: "Menu" })).toHaveAttribute("aria-expanded", "false")
  })

  test("cabeçalho continua fixo ao rolar e o escudo encolhe", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await abrirLanding(page)
    const antes = (await page.locator(".crest").boundingBox())!.height
    await page.mouse.wheel(0, 500)
    await expect(page.locator("header.site.is-stuck")).toHaveCount(1)
    await expect.poll(async () => (await page.locator(".crest").boundingBox())!.height).toBeLessThan(antes)
    expect((await page.locator("header.site").boundingBox())!.y).toBe(0)
  })
})
