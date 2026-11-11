import { test, expect } from "@playwright/test"

test.describe("Site público — topo e busca", () => {
  test("topo tem busca e chamada Matricule-se", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("link", { name: "Matricule-se" })).toHaveAttribute("href", "/matricula")
    await expect(page.getByRole("search", { name: "Buscar no site" })).toBeVisible()
  })

  test("busca pelo topo abre /buscar sem login e mostra o termo", async ({ page }) => {
    await page.goto("/")
    const campo = page.getByRole("search", { name: "Buscar no site" }).getByRole("searchbox")
    await campo.fill("mundial")
    await campo.press("Enter")
    await expect(page).toHaveURL(/\/buscar\?q=mundial/)
    await expect(page.getByRole("heading", { level: 1, name: "Buscar" })).toBeVisible()
    await expect(page.getByRole("link", { name: /Campeão Mundial Sub-13 na França/ })).toBeVisible()
  })

  test("termo sem resultado mostra estado vazio", async ({ page }) => {
    await page.goto("/buscar?q=zzqqxxnaoexiste")
    await expect(page.getByRole("heading", { name: /Nada encontrado/ })).toBeVisible()
    await expect(page.getByRole("link", { name: "Ver todas as partidas" })).toBeVisible()
  })
})
