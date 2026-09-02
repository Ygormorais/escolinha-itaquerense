import { expect, test } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

test.describe("Mídia — upload", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test("selecionar arquivo não alterna o input de uncontrolled para controlled", async ({ page }) => {
    const consoleProblems: string[] = []
    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") {
        consoleProblems.push(message.text())
      }
    })

    await page.goto("/configuracoes/midia")
    await page.getByRole("button", { name: "Nova Mídia" }).click()

    const arquivo = page.getByLabel("Arquivo")
    await arquivo.setInputFiles({
      name: "treino.mp4",
      mimeType: "video/mp4",
      buffer: Buffer.from("arquivo de teste"),
    })

    await expect(arquivo).toHaveValue(/treino\.mp4$/)
    expect(consoleProblems.filter((message) =>
      message.includes("changing the uncontrolled value state of FieldControl")
    )).toEqual([])
  })
})
