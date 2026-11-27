import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

// Varredura automática (axe, WCAG A e AA) das telas principais: só falha com problema crítico ou sério,
// os que de fato impedem alguém de ler ou usar a tela.
async function violacoesSerias(page: Page) {
  const resultado = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()
  return resultado.violations
    .filter((v) => v.impact === "critical" || v.impact === "serious")
    .map((v) => ({ regra: v.id, impacto: v.impact, alvos: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) }))
}

const PAGINAS_PUBLICAS = ["/", "/horarios", "/aula-experimental", "/partidas", "/noticias/publico", "/matricula", "/login", "/responsavel/login"]
const PAGINAS_PORTAL = ["/responsavel", "/responsavel/mensalidades", "/responsavel/calendario", "/responsavel/jogos", "/responsavel/documentos"]
const PAGINAS_ADMIN = ["/dashboard", "/pendencias", "/alunos", "/configuracoes/satisfacao", "/configuracoes/aula-experimental"]

test.describe("Acessibilidade — site público", () => {
  for (const caminho of PAGINAS_PUBLICAS) {
    test(`${caminho} sem problemas críticos`, async ({ page }) => {
      await page.goto(caminho, { waitUntil: "networkidle" })
      expect(await violacoesSerias(page)).toEqual([])
    })
  }
})

test.describe("Acessibilidade — portal da família", () => {
  test.use({ storageState: "e2e/.auth/responsavel.json" })
  for (const caminho of PAGINAS_PORTAL) {
    test(`${caminho} sem problemas críticos`, async ({ page }) => {
      await page.goto(caminho, { waitUntil: "networkidle" })
      expect(new URL(page.url()).pathname).toBe(caminho)
      expect(await violacoesSerias(page)).toEqual([])
    })
  }
})

test.describe("Acessibilidade — admin", () => {
  for (const caminho of PAGINAS_ADMIN) {
    test(`${caminho} sem problemas críticos`, async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto(caminho, { waitUntil: "networkidle" })
      expect(new URL(page.url()).pathname).toBe(caminho)
      expect(await violacoesSerias(page)).toEqual([])
    })
  }
})

test.describe("Acessibilidade — site público no tema escuro", () => {
  for (const caminho of ["/", "/horarios", "/partidas"]) {
    test(`${caminho} sem problemas críticos`, async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem("theme", "dark"))
      await page.goto(caminho, { waitUntil: "networkidle" })
      expect(await violacoesSerias(page)).toEqual([])
    })
  }
})
