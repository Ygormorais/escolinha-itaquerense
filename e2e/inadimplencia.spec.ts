import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"
import { resetInadimplenciaE2E } from "./fixtures"
import { db } from "@/lib/db"

test.beforeEach(async ({ page }) => {
  await resetInadimplenciaE2E()
  await loginAsAdmin(page)
})

test.describe("Inadimplência — agora o filtro Atrasados da central", () => {
  test("/inadimplencia redireciona para a central filtrada", async ({ page }) => {
    await page.goto("/inadimplencia")
    await expect(page).toHaveURL(/\/pagamentos\?filtro=atrasados/)
  })

  test("inadimplente controlado aparece com o valor em aberto", async ({ page }) => {
    await page.goto("/pagamentos?filtro=atrasados")
    const item = page.locator('[data-slot="lista-devedores"] li').filter({ hasText: "E2E Aluno Inadimplente" })
    await expect(item).toBeVisible()
    await expect(item).toContainText("Sub-11")
    await expect(item).toContainText("R$ 175,00")
  })

  test("marcar um aluno libera a cobrança em lote no WhatsApp", async ({ page }) => {
    await page.goto("/pagamentos?filtro=atrasados")
    await expect(page.getByRole("button", { name: /Cobrar selecionados no WhatsApp/i })).toHaveCount(0)
    await page.getByRole("checkbox", { name: "Selecionar E2E Aluno Inadimplente" }).check()
    await expect(page.getByRole("button", { name: /Cobrar selecionados no WhatsApp/i })).toBeVisible()
  })
})

test.describe("Atenção: risco de evasão", () => {
  test("aluno com 3 faltas seguidas e mensalidade vencida aparece nas pendências com WhatsApp", async ({ page }) => {
    const aluno = await db.aluno.findFirstOrThrow({ where: { nome: "E2E Aluno Inadimplente" }, select: { id: true } })
    const hoje = new Date()
    await db.frequencia.createMany({
      data: [1, 2, 3].map((d) => ({ alunoId: aluno.id, data: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - d, 12), presenca: "Ausente" })),
    })

    await page.goto("/pendencias")
    const secao = page.locator("section").filter({ has: page.getByRole("heading", { name: "Atenção: risco de evasão" }) })
    const item = secao.locator("li").filter({ hasText: "E2E Aluno Inadimplente" })
    await expect(item).toContainText("3 faltas seguidas")
    await expect(item).toContainText("1 mensalidade em atraso")
    await expect(item.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute("href", /^https:\/\/wa\.me\/5511999996666\?text=/)
  })
})
