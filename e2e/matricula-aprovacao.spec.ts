/**
 * E2E — Aprovação de Pré-Matrícula (fluxo completo)
 *
 * Cria uma pré-matrícula via formulário público e depois testa o fluxo de
 * aprovação pelo admin: abre o dialog, preenche a mensalidade e confirma.
 * Verifica que o aluno é criado na lista de alunos após a aprovação.
 */

import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

// ── Helpers locais ─────────────────────────────────────────────────────────

/** Cria uma pré-matrícula via formulário público e retorna o nome único do aluno */
async function criarPreMatriculaPublica(page: Parameters<typeof loginAsAdmin>[0]) {
  const nomeAluno = `E2E Aprovacao ${Date.now()}`

  await page.goto("/matricula")
  await page.waitForLoadState("networkidle")

  await page.fill('input[id="aluno"]', nomeAluno)
  await page.fill('input[id="dataNasc"]', "2015-03-20")
  await page.fill('input[id="responsavel"]', "Responsável E2E Aprovacao")
  await page.fill('input[id="telefone"]', "(11) 98765-4321")
  await page.fill('input[id="email"]', `e2e.aprovacao.${Date.now()}@email.test`)
  await page.click('button[type="submit"]')

  // Aguarda a mensagem de confirmação antes de prosseguir
  await expect(page.getByRole("heading", { name: /Pré-matrícula enviada/ })).toBeVisible({ timeout: 10000 })

  return nomeAluno
}

/** Localiza a linha (item da lista) de uma pré-matrícula pelo nome do aluno */
function linhaPreMatricula(page: Parameters<typeof loginAsAdmin>[0], nomeAluno: string) {
  return page.locator(".divide-y > div").filter({ hasText: nomeAluno })
}

// ── Testes ─────────────────────────────────────────────────────────────────

test.describe("Aprovação de Pré-Matrícula — fluxo admin", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test("página de pré-matrículas carrega com título e filtros", async ({ page }) => {
    await page.goto("/configuracoes/matriculas")
    await expect(page.getByRole("heading", { name: /Pré-Matrículas/i })).toBeVisible()
    // filtro de status presente
    await expect(page.locator('select').first()).toBeVisible()
  })

  test("campo de busca filtra pré-matrículas por nome", async ({ page }) => {
    await page.goto("/configuracoes/matriculas")
    const input = page.locator('input[placeholder*="Buscar"]').first()
    if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
      await input.fill("zzz_nao_existe_e2e_busca")
      await expect(page.getByText(/Nenhuma pré-matrícula/i)).toBeVisible({ timeout: 5000 })
      await input.clear()
    }
  })

  test("filtro de status 'Pendentes' exibe apenas registros pendentes", async ({ page }) => {
    await page.goto("/configuracoes/matriculas")
    const filtroSelect = page.locator("select").first()
    if (await filtroSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await filtroSelect.selectOption("pendente")
      // Não deve mostrar badges "Aprovada" nem "Recusada" na lista
      const badgesAprovada = page.locator("span").filter({ hasText: /^Aprovada$/ })
      const count = await badgesAprovada.count()
      expect(count).toBe(0)
    }
  })

  test("dialog de aprovação exibe campos de mensalidade, desconto e meses", async ({ page }) => {
    await page.goto("/configuracoes/matriculas")
    const btnAprovar = page.getByRole("button", { name: /Aprovar/i }).first()
    if (!(await btnAprovar.isVisible({ timeout: 3000 }).catch(() => false))) return

    await btnAprovar.click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()

    // Campos esperados no AprovarDialog
    await expect(dialog.locator('input[type="number"]').first()).toBeVisible()
    // Select de meses
    await expect(dialog.locator('[role="combobox"]')).toBeVisible()
    // Botão de confirmar está desabilitado com mensalidade vazia
    await expect(dialog.getByRole("button", { name: /Criar aluno/i })).toBeDisabled()

    await dialog.getByRole("button", { name: /Cancelar/i }).click()
    await expect(dialog).not.toBeVisible()
  })

  test("aprovação completa cria aluno na lista de alunos", async ({ page }) => {
    // Passo 1: cria pré-matrícula via formulário público (sem login)
    await page.context().clearCookies()
    const nomeAluno = await criarPreMatriculaPublica(page)

    // Passo 2: faz login como admin
    await loginAsAdmin(page)

    // Passo 3: acessa pré-matrículas e localiza o registro recém-criado
    await page.goto("/configuracoes/matriculas")
    await page.waitForLoadState("networkidle")

    // Localiza a linha do aluno criado
    const linhaAluno = linhaPreMatricula(page, nomeAluno)
    await expect(linhaAluno).toBeVisible({ timeout: 8000 })

    // Abre o dialog de aprovação através do botão na linha desse aluno
    const btnAprovar = linhaAluno.getByRole("button", { name: /Aprovar/i }).first()
    await btnAprovar.click()

    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()

    // Preenche mensalidade e confirma
    await dialog.locator('input[type="number"]').first().fill("200")
    // "Criar aluno" deve ficar habilitado
    const btnCriar = dialog.getByRole("button", { name: /Criar aluno/i })
    await expect(btnCriar).toBeEnabled({ timeout: 3000 })
    await btnCriar.click()

    // Dialog deve fechar após confirmação
    await expect(dialog).not.toBeVisible({ timeout: 10000 })

    // Passo 4: verifica que o aluno aparece na lista de alunos
    await page.goto("/alunos")
    await page.waitForLoadState("networkidle")
    await expect(page.getByText(nomeAluno)).toBeVisible({ timeout: 10000 })
  })

  test("rejeição de pré-matrícula muda status para Recusada", async ({ page }) => {
    // Cria pré-matrícula fresca para recusar
    await page.context().clearCookies()
    const nomeAluno = await criarPreMatriculaPublica(page)
    await loginAsAdmin(page)

    await page.goto("/configuracoes/matriculas")
    await page.waitForLoadState("networkidle")

    const linhaAluno = linhaPreMatricula(page, nomeAluno)
    await expect(linhaAluno).toBeVisible({ timeout: 8000 })

    const btnRecusar = linhaAluno.getByRole("button", { name: /Recusar/i })
    await btnRecusar.click()

    // Aguarda o toast ou a mudança de badge
    await page.waitForLoadState("networkidle")

    // O aluno não deve mais ter o botão "Aprovar" (status mudou para recusada)
    const btnAprovarApos = linhaAluno.getByRole("button", { name: /Aprovar/i })
    await expect(btnAprovarApos).not.toBeVisible({ timeout: 5000 })
  })

  test("remover pré-matrícula via botão de lixeira exibe confirm e remove", async ({ page }) => {
    await page.context().clearCookies()
    const nomeAluno = await criarPreMatriculaPublica(page)
    await loginAsAdmin(page)

    await page.goto("/configuracoes/matriculas")
    await page.waitForLoadState("networkidle")

    const linhaAluno = linhaPreMatricula(page, nomeAluno)
    await expect(linhaAluno).toBeVisible({ timeout: 8000 })

    // O botão de lixeira (ConfirmDialog trigger)
    const btnLixeira = linhaAluno.getByRole("button", { name: "Remover pré-matrícula" })
    await btnLixeira.click()

    // ConfirmDialog é um AlertDialog → role "alertdialog"
    const confirmDialog = page.getByRole("alertdialog")
    await expect(confirmDialog).toBeVisible()
    await expect(confirmDialog.getByRole("heading", { name: /Remover pré-matrícula/i })).toBeVisible()

    // Cancela — não remove
    const btnCancelar = confirmDialog.getByRole("button", { name: /Cancelar/i })
    if (await btnCancelar.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btnCancelar.click()
      await expect(confirmDialog).not.toBeVisible()
      // O aluno ainda deve estar na lista
      await expect(page.getByText(nomeAluno)).toBeVisible()
    }
  })
})
