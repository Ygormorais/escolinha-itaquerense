import { test, expect } from "@playwright/test"
import { db } from "@/lib/db"

const CAMPEONATO = "E2E Compartilhar Sub-11"
const ADVERSARIO = "E2E Rival Compartilhar"

let idFinalizada = 0
let idFutura = 0

async function limpar() {
  await db.campeonato.deleteMany({ where: { nome: CAMPEONATO } })
}

test.describe("Resultado compartilhável da partida", () => {
  test.beforeAll(async () => {
    await limpar()
    const hoje = new Date()
    const campeonato = await db.campeonato.create({
      data: {
        nome: CAMPEONATO,
        dataInicio: new Date(hoje.getFullYear(), 0, 1),
        status: "andamento",
        partidas: {
          create: [
            { rodada: 1, data: new Date(hoje.getTime() - 5 * 86_400_000), adversario: ADVERSARIO, local: "Casa", golsPro: 3, golsContra: 1, resultado: "Vitoria" },
            { rodada: 2, data: new Date(hoje.getTime() + 20 * 86_400_000), adversario: ADVERSARIO, local: "Casa" },
          ],
        },
      },
      include: { partidas: { orderBy: { rodada: "asc" } } },
    })
    idFinalizada = campeonato.partidas[0].id
    idFutura = campeonato.partidas[1].id
  })
  test.afterAll(limpar)

  test("jogo finalizado tem página pública com placar e botão de WhatsApp", async ({ page }) => {
    await page.goto(`/partidas/${idFinalizada}`)
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Itaquerense 3 × 1")
    const compartilhar = page.getByRole("link", { name: /Compartilhar no WhatsApp/ })
    await expect(compartilhar).toHaveAttribute("href", /^https:\/\/wa\.me\/\?text=/)
    expect(decodeURIComponent((await compartilhar.getAttribute("href"))!)).toContain(`/partidas/${idFinalizada}`)
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /Itaquerense 3 × 1/)
  })

  test("a imagem do cartão é um PNG", async ({ request }) => {
    const resposta = await request.get(`/partidas/${idFinalizada}/opengraph-image`)
    expect(resposta.status()).toBe(200)
    expect(resposta.headers()["content-type"]).toContain("image/png")
  })

  test("jogo futuro, inexistente ou com id inválido respondem 404", async ({ request }) => {
    for (const id of [String(idFutura), "999999999", "abc", "0", "-3"]) {
      const resposta = await request.get(`/partidas/${id}`)
      expect(resposta.status(), `id ${id}`).toBe(404)
    }
  })

  test("a lista pública oferece compartilhar só nos jogos realizados", async ({ page }) => {
    await page.goto("/partidas?categoria=Sub-11&situacao=realizados")
    const linha = page.locator("li.pt-linha").filter({ hasText: ADVERSARIO })
    await expect(linha.getByRole("link", { name: /Compartilhar/ })).toHaveAttribute("href", /wa\.me/)

    await page.goto("/partidas?categoria=Sub-11&situacao=proximos")
    const futura = page.locator("li.pt-linha").filter({ hasText: ADVERSARIO })
    await expect(futura).toBeVisible()
    await expect(futura.getByRole("link", { name: /Compartilhar/ })).toHaveCount(0)
  })
})
