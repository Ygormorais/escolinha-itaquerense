import { expect, test } from "@playwright/test"
import { format } from "date-fns"
import { db } from "@/lib/db"
import { resetCheckinE2E } from "./fixtures"
import { loginAsAdmin } from "./helpers"

test("check-in usa link assinado sem expor a lista da turma", async ({ page }) => {
  const aluno = await resetCheckinE2E()
  await loginAsAdmin(page)
  await page.goto("/frequencia/qrcode")

  const urlOutput = page.getByTestId("checkin-url")
  await expect(urlOutput).toContainText("/checkin?token=")
  const checkinUrl = await urlOutput.textContent()
  expect(checkinUrl).toBeTruthy()

  await page.goto(checkinUrl!)
  await expect(page.getByRole("heading", { name: "Check-in de Presença" })).toBeVisible()
  await expect(page.getByText(aluno.nome)).toHaveCount(0)

  await page.locator("#matricula").fill(String(aluno.id).padStart(6, "0"))
  await page.locator("#dataNascimento").fill("2015-06-15")
  await page.getByRole("button", { name: "Confirmar presença" }).click()

  await expect(page).toHaveURL(/ok=1/)
  await expect(page.getByRole("heading", { name: "Presença confirmada!" })).toBeVisible()

  const data = new Date(`${format(new Date(), "yyyy-MM-dd")}T12:00:00.000Z`)
  await expect.poll(() => db.frequencia.findUnique({
    where: { alunoId_data: { alunoId: aluno.id, data } },
    select: { presenca: true },
  })).toEqual({ presenca: "Presente" })
})

test("check-in não revela se matrícula ou nascimento estão errados", async ({ page }) => {
  const aluno = await resetCheckinE2E()
  await loginAsAdmin(page)
  await page.goto("/frequencia/qrcode")
  const urlOutput = page.getByTestId("checkin-url")
  await expect(urlOutput).toContainText("/checkin?token=")
  const checkinUrl = await urlOutput.textContent()

  await page.goto(checkinUrl!)
  await page.locator("#matricula").fill(String(aluno.id))
  await page.locator("#dataNascimento").fill("2015-06-16")
  await page.getByRole("button", { name: "Confirmar presença" }).click()

  await expect(page.getByRole("alert")).toContainText("Dados não conferem")
  await expect(page.getByText(aluno.nome)).toHaveCount(0)
})
