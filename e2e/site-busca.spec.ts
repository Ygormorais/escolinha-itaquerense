import { test, expect } from "@playwright/test"

test.describe("Site público — topo e busca", () => {
  test("topo tem busca e chamada Matricule-se", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("link", { name: "Matricule-se" })).toHaveAttribute("href", "/matricula")
    await expect(page.getByRole("link", { name: "Buscar no site" })).toHaveAttribute("href", "/buscar")
  })

  test("lupa do topo abre /buscar sem login e acha matéria", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("link", { name: "Buscar no site" }).click()
    await expect(page).toHaveURL(/\/buscar$/)
    const campo = page.getByRole("searchbox", { name: "Buscar no site" })
    await expect(campo).toBeFocused()
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
