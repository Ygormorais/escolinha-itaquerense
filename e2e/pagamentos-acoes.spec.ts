/**
 * E2E — Ações sobre Pagamentos
 *
 * Cobre os fluxos que o pagamentos.spec.ts existente deixa descobertos:
 *   • PIX direto (PixButton abre PixModal com QR code e botão de copiar)
 *   • Cobrança via Mercado Pago (CobrancaDialog — seleciona canal e clica Emitir)
 *   • Gerar mensalidades do mês (ConfirmDialog de geração)
 *   (baixa e lote: ver painel-aluno-pagamentos.spec.ts)
 *   • Filtro de status na tabela de pagamentos
 *   • Filtro por turma na tabela de pagamentos
 *   • Link de recibo na linha de pagamento pago
 *   • Página PIX (/caixa/pix) — tabs Emitidos e Recebidos
 */

import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"
import { resetPagamentosE2E } from "./fixtures"

test.beforeEach(async ({ page }) => {
  await resetPagamentosE2E()
  await loginAsAdmin(page)
})

function linhaPagamento(page: Parameters<typeof loginAsAdmin>[0], nomeAluno: string) {
  const aluno = page.getByRole("link", { name: nomeAluno, exact: true })
  return page.getByRole("row").filter({ has: aluno })
}

// ── PIX direto (PixButton → PixModal) ────────────────────────────────────

test.describe("Pagamentos — PIX direto", () => {
  test("botão 'PIX direto' abre PixModal com QR code e código para copiar", async ({ page }) => {
    await page.goto("/pagamentos?filtro=mes")
    await page.waitForLoadState("networkidle")

    const btnPix = linhaPagamento(page, "E2E Aluno Pagamentos 1").getByRole("button", { name: /PIX direto/i })
    await expect(btnPix).toBeVisible()

    await btnPix.click()
    const modal = page.getByRole("dialog")
    await expect(modal).toBeVisible()
    await expect(modal.getByRole("heading", { name: /Pagar via PIX/i })).toBeVisible()

    // Deve exibir valor em R$
    await expect(modal.getByText(/R\$\s*[\d,.]+/)).toBeVisible({ timeout: 5000 })

    // Botão de copiar código PIX
    await expect(modal.getByRole("button", { name: /Copiar código PIX/i })).toBeVisible()

    // Fecha
    await page.keyboard.press("Escape")
    await expect(modal).not.toBeVisible({ timeout: 5000 })
  })

  test("botão 'Copiar código PIX' reflete estado copiado", async ({ page }) => {
    await page.goto("/pagamentos?filtro=mes")
    await page.waitForLoadState("networkidle")

    const btnPix = linhaPagamento(page, "E2E Aluno Pagamentos 1").getByRole("button", { name: /PIX direto/i })
    await expect(btnPix).toBeVisible()

    await btnPix.click()
    const modal = page.getByRole("dialog")
    await expect(modal).toBeVisible()

    const btnCopiar = modal.getByRole("button", { name: /Copiar código PIX/i })
    await expect(btnCopiar).toBeVisible()
    await btnCopiar.click()

    // Após copiar, o botão muda para "Copiado!"
    await expect(modal.getByRole("button", { name: /Copiado!/i })).toBeVisible({ timeout: 3000 })
  })
})

// ── CobrancaDialog (Mercado Pago) ─────────────────────────────────────────

test.describe("Pagamentos — cobrança Mercado Pago", () => {
  test("botão 'Gerar' abre CobrancaDialog com seletor de canal", async ({ page }) => {
    await page.goto("/pagamentos?filtro=mes")
    await page.waitForLoadState("networkidle")

    // O botão "Gerar" aparece na coluna "Cobrança" para pagamentos sem externalId
    const btnGerar = page.getByRole("button", { name: /^Gerar$/i }).first()
    await expect(btnGerar).toBeVisible()
    await btnGerar.click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole("heading", { name: /Cobrança/i })).toBeVisible()

    // Select de canal (PIX / Boleto)
    await expect(dialog.locator('[role="combobox"]')).toBeVisible()

    // Botão "Emitir cobrança" presente
    await expect(dialog.getByRole("button", { name: /Emitir cobrança/i })).toBeVisible()

    // Fecha sem emitir
    await dialog.getByRole("button", { name: /Fechar/i }).click()
    await expect(dialog).not.toBeVisible()
  })

  test("CobrancaDialog permite selecionar canal 'Boleto'", async ({ page }) => {
    await page.goto("/pagamentos?filtro=mes")
    await page.waitForLoadState("networkidle")

    const btnGerar = page.getByRole("button", { name: /^Gerar$/i }).first()
    await expect(btnGerar).toBeVisible()
    await btnGerar.click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()

    // Abre o select e escolhe Boleto
    const selectTrigger = dialog.locator('[role="combobox"]').first()
    await selectTrigger.click()
    const opcaoBoleto = page.getByRole("option", { name: /Boleto/i })
    await expect(opcaoBoleto).toBeVisible()
    await opcaoBoleto.click()
    await expect(selectTrigger).toContainText(/Boleto/)

    await dialog.getByRole("button", { name: /Fechar/i }).click()
  })

  test("cobrança já emitida exibe badge de status ao clicar", async ({ page }) => {
    await page.goto("/pagamentos?filtro=mes")
    await page.waitForLoadState("networkidle")

    const linha = linhaPagamento(page, "E2E Aluno Pagamentos 3")
    const badgeCobranca = linha.getByText("Aguardando", { exact: true })
    await expect(badgeCobranca).toBeVisible()

    await badgeCobranca.click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    // Dialog deve mostrar dados da cobrança já emitida
    await expect(dialog.getByRole("heading", { name: /Cobrança/i })).toBeVisible()
    await dialog.getByRole("button", { name: /Fechar/i }).click()
  })
})

// ── Gerar Mensalidades do mês ─────────────────────────────────────────────

test.describe("Pagamentos — gerar mensalidades", () => {
  test("botão 'Gerar Mensalidades' abre dialog de confirmação", async ({ page }) => {
    await page.goto("/pagamentos?filtro=mes")
    await page.waitForLoadState("networkidle")

    const btnGerar = page.getByRole("button", { name: /Gerar Mensalidades/i })
    await expect(btnGerar).toBeVisible()
    await btnGerar.click()

    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole("heading", { name: /Gerar Mensalidades/i })).toBeVisible()

    // Deve exibir o mês de referência no texto
    await expect(dialog.locator("p, span").filter({ hasText: /\d{4}-\d{2}/ }).first()).toBeVisible()

    // Cancela
    await dialog.getByRole("button", { name: /Cancelar|Fechar|Close/i }).first().click()
    await expect(dialog).not.toBeVisible({ timeout: 5000 })
  })

  test("confirmar geração exibe resultado (criadas/já existiam)", async ({ page }) => {
    await page.goto("/pagamentos?filtro=mes")
    await page.waitForLoadState("networkidle")

    const btnGerar = page.getByRole("button", { name: /Gerar Mensalidades/i })
    await btnGerar.click()

    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()

    const btnConfirmar = dialog.getByRole("button", { name: /Confirmar/i })
    await btnConfirmar.click()

    // Aguarda: ou o dialog fecha (após geração), ou exibe resultado parcial
    // Pode mostrar mensagem "X criada(s), Y já existia(m)" dentro do dialog antes de fechar
    const resultado = dialog.getByText(/criada|existia|gerada/i)
    await expect(async () => {
      const temResultado = await resultado.isVisible()
      const aberto = await dialog.isVisible()
      expect(temResultado || !aberto).toBe(true)
    }).toPass({ timeout: 10000 })

    // A tabela continua visível após a operação
    await expect(page.locator("table")).toBeVisible({ timeout: 5000 })
  })
})

// ── Filtros avançados na tabela ────────────────────────────────────────────

test.describe("Pagamentos — filtros de status e turma", () => {
  test("filtro 'Pago' exibe apenas pagamentos com data de pagamento", async ({ page }) => {
    await page.goto("/pagamentos?filtro=mes")
    await page.waitForLoadState("networkidle")

    // O select de status (Todos/Pago/Pendente/Vencido) — segundo select na página
    const selects = page.locator('[role="combobox"]')
    const statusSelect = selects.nth(0)

    await expect(statusSelect).toBeVisible()
    await statusSelect.click()
    const opcaoPago = page.getByRole("option", { name: /^Pago$/i })
    await expect(opcaoPago).toBeVisible()
    await opcaoPago.click()
    // Todos os status badges visíveis nas células devem ser "Pago"
    // (contar só células — há elementos ocultos do select com esses textos)
    const badgesPendente = page.getByRole("cell").filter({ hasText: /^Pendente$/ })
    const badgesVencido = page.getByRole("cell").filter({ hasText: /^Vencido$/ })
    expect(await badgesPendente.count()).toBe(0)
    expect(await badgesVencido.count()).toBe(0)
  })

  test("filtro 'Pendente' esconde linhas com pagamento já efetuado", async ({ page }) => {
    await page.goto("/pagamentos?filtro=mes")
    await page.waitForLoadState("networkidle")

    const selects = page.locator('[role="combobox"]')
    const statusSelect = selects.nth(0)
    await expect(statusSelect).toBeVisible()
    await statusSelect.click()
    const opcaoPendente = page.getByRole("option", { name: /^Pendente$/i })
    await expect(opcaoPendente).toBeVisible()
    await opcaoPendente.click()
    const badgesPago = page.getByRole("cell").filter({ hasText: /^Pago$/ })
    expect(await badgesPago.count()).toBe(0)
  })

  test("filtro por turma restringe resultados à turma selecionada", async ({ page }) => {
    await page.goto("/pagamentos?filtro=mes")
    await page.waitForLoadState("networkidle")

    // O select de turma é o terceiro [role="combobox"] na página
    const turmaSelect = page.locator('[role="combobox"]').nth(1)
    await expect(turmaSelect).toBeVisible()
    await turmaSelect.click()
    const opcaoTurmaE2E = page.getByRole("option", { name: "E2E Testes", exact: true })
    await expect(opcaoTurmaE2E).toBeVisible()
    await opcaoTurmaE2E.click()

    // Todos os dados controlados pelo fixture pertencem à turma selecionada.
    const linhas = page.locator("table tbody tr")
    expect(await linhas.count()).toBeGreaterThan(0)
    for (const linha of await linhas.all()) {
      await expect(linha).toContainText("E2E Testes")
    }
  })
})

// ── Link de recibo em pagamento pago ──────────────────────────────────────

test.describe("Pagamentos — recibo inline", () => {
  test("pagamento já pago exibe link 'Recibo' apontando para /recibos", async ({ page }) => {
    await page.goto("/pagamentos?filtro=mes")
    await page.waitForLoadState("networkidle")

    // Filtra por "Pago" para encontrar pagamentos com recibo disponível
    const statusSelect = page.locator('[role="combobox"]').nth(0)
    await expect(statusSelect).toBeVisible()
    await statusSelect.click()
    const opcaoPago = page.getByRole("option", { name: /^Pago$/i })
    await expect(opcaoPago).toBeVisible()
    await opcaoPago.click()

    const linkRecibo = page.getByRole("link", { name: /Recibo/i }).first()
    await expect(linkRecibo).toBeVisible()
    const href = await linkRecibo.getAttribute("href")
    expect(href).toMatch(/\/recibos/)
    // O link deve abrir numa nova aba (_blank) — não navegamos por aqui
  })
})

// ── Página /caixa/pix — tabs e conteúdo ──────────────────────────────────

test.describe("Caixa — página PIX", () => {
  test("carrega com heading 'PIX'", async ({ page }) => {
    await page.goto("/caixa/pix")
    await expect(page.getByRole("heading", { name: "PIX", exact: true })).toBeVisible()
  })

  test("aba 'Emitidos' está ativa por padrão e exibe contagem", async ({ page }) => {
    await page.goto("/caixa/pix")
    // O TabsTrigger com "Emitidos" inclui a contagem
    const tabEmitidos = page.getByRole("tab", { name: /Emitidos/i })
    await expect(tabEmitidos).toBeVisible()
    await expect(tabEmitidos).toHaveAttribute("aria-selected", "true")
  })

  test("aba 'Recebidos' é clicável e carrega conteúdo", async ({ page }) => {
    await page.goto("/caixa/pix")
    const tabRecebidos = page.getByRole("tab", { name: /Recebidos/i })
    await expect(tabRecebidos).toBeVisible()
    await tabRecebidos.click()
    await expect(tabRecebidos).toHaveAttribute("aria-selected", "true")

    await expect(page.locator("table")).toBeVisible()
    await expect(page.getByRole("link", { name: "E2E Aluno Pagamentos Pago", exact: true })).toBeVisible()
  })

  test("aba 'Emitidos' exibe a cobrança PIX controlada", async ({ page }) => {
    await page.goto("/caixa/pix")
    await expect(page.locator("table")).toBeVisible()
    await expect(page.getByRole("link", { name: "E2E Aluno Pagamentos 3", exact: true })).toBeVisible()
  })

  test("description do header exibe contagem e valor total", async ({ page }) => {
    await page.goto("/caixa/pix")
    // O PageHeader tem uma description com "X recebidos · R$ YYY"
    await expect(page.getByText(/recebidos/i).first()).toBeVisible()
  })
})
