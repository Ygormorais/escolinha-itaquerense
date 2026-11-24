import { test, expect } from "@playwright/test"
import { db } from "@/lib/db"
import { loginAsAdmin } from "./helpers"

const RESP_STORAGE = "e2e/.auth/responsavel.json"
const TITULO = "E2E Pesquisa de satisfação"

async function limpar() {
  await db.pesquisaSatisfacao.deleteMany({})
}

test.describe("Pesquisa de satisfação (NPS)", () => {
  test.describe.configure({ mode: "serial" })
  test.beforeAll(limpar)
  test.afterAll(limpar)

  test("admin cria a pesquisa e o painel começa sem respostas", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto("/configuracoes/satisfacao")
    await expect(page.getByRole("heading", { name: "Pesquisa de satisfação", level: 1 })).toBeVisible()
    await page.getByRole("button", { name: "Nova pesquisa" }).click()
    await page.getByLabel("Título (as famílias veem)").fill(TITULO)
    await page.getByRole("button", { name: "Criar pesquisa" }).click()
    await expect(page.getByRole("heading", { name: TITULO })).toBeVisible()
    await expect(page.getByText("Ainda não há respostas")).toBeVisible()
    // Uma por vez: o botão fica desligado enquanto houver pesquisa aberta.
    await expect(page.getByRole("button", { name: "Nova pesquisa" })).toBeDisabled()
  })

  test("família vê o cartão em Precisa de você e responde uma única vez", async ({ browser }) => {
    const context = await browser.newContext({ storageState: RESP_STORAGE })
    const page = await context.newPage()
    await page.goto("/responsavel")
    const cartao = page.getByRole("region", { name: "Precisa de você" })
    await cartao.getByRole("link", { name: new RegExp(`Pesquisa de satisfação: ${TITULO}`) }).click()
    await expect(page).toHaveURL(/\/responsavel\/pesquisa/)

    // Sem nota escolhida, o servidor nem é chamado e o erro aparece.
    await page.getByRole("button", { name: "Enviar resposta" }).click()
    await expect(page.locator("#pesquisa-erro")).toContainText("Escolha uma nota")

    await page.getByRole("radio", { name: "3" }).check({ force: true })
    await page.getByLabel(/O que motivou a sua nota/).fill("Os horários mudaram sem aviso.")
    await page.getByRole("button", { name: "Enviar resposta" }).click()
    await expect(page.getByText("Obrigado pela sua opinião!")).toBeVisible()

    await page.goto("/responsavel/pesquisa")
    await expect(page.getByText("Resposta recebida. Obrigado!")).toBeVisible()
    await page.goto("/responsavel")
    await expect(page.getByRole("link", { name: new RegExp(`Pesquisa de satisfação: ${TITULO}`) })).toHaveCount(0)
    await context.close()
  })

  test("painel mostra o detrator com comentário e botão de WhatsApp", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto("/configuracoes/satisfacao")
    await expect(page.getByRole("heading", { name: /Detratores para contato \(1\)/ })).toBeVisible()
    await expect(page.getByText("Os horários mudaram sem aviso.").first()).toBeVisible()
    await expect(page.getByRole("link", { name: /Chamar no WhatsApp/ })).toHaveAttribute("href", /^https:\/\/wa\.me\//)

    await page.getByLabel("Ocultar nomes (para apresentar)").check()
    await page.getByRole("button", { name: "Aplicar" }).click()
    await expect(page.getByRole("link", { name: /Chamar no WhatsApp/ })).toHaveCount(0)
    await expect(page.getByText("Família anônima").first()).toBeVisible()
  })

  test("admin encerra a pesquisa e a família não vê mais o formulário", async ({ page, browser }) => {
    await loginAsAdmin(page)
    await page.goto("/configuracoes/satisfacao")
    page.once("dialog", (dialog) => dialog.accept())
    await page.getByRole("button", { name: "Encerrar pesquisa" }).click()
    await expect(page.getByRole("button", { name: "Nova pesquisa" })).toBeEnabled()

    const context = await browser.newContext({ storageState: RESP_STORAGE })
    const familia = await context.newPage()
    await familia.goto("/responsavel/pesquisa")
    await expect(familia.getByText("Nenhuma pesquisa aberta")).toBeVisible()
    await context.close()
  })
})
