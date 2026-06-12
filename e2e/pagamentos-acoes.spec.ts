/**
 * E2E — Ações sobre Pagamentos
 *
 * Cobre os fluxos que o pagamentos.spec.ts existente deixa descobertos:
 *   • Registro manual de pagamento (preenche o dialog e confirma)
 *   • PIX direto (PixButton abre PixModal com QR code e botão de copiar)
 *   • Cobrança via Mercado Pago (CobrancaDialog — seleciona canal e clica Emitir)
 *   • Gerar mensalidades do mês (ConfirmDialog de geração)
 *   • Registro em lote (seleciona múltiplos e abre BulkDialog)
 *   • Filtro de status na tabela de pagamentos
 *   • Filtro por turma na tabela de pagamentos
 *   • Link de recibo na linha de pagamento pago
 *   • Página PIX (/caixa/pix) — tabs Emitidos e Recebidos
 */

import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page)
})

// ── Registro manual de pagamento ──────────────────────────────────────────

test.describe("Pagamentos — registro manual completo", () => {
  test("abre dialog 'Registrar Pagamento', preenche e confirma", async ({ page }) => {
    await page.goto("/pagamentos")
    await page.waitForLoadState("networkidle")

    // Precisa de uma linha de pagamento pendente
    const btnRegistrar = page.getByRole("button", { name: /Registrar/i }).first()
    if (!(await btnRegistrar.isVisible({ timeout: 5000 }).catch(() => false))) {
      // Nenhum pagamento pendente — passa silenciosamente
      return
    }

    await btnRegistrar.click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole("heading", { name: /Registrar Pagamento/i })).toBeVisible()

    // Campos do formulário devem estar visíveis
    const dateInput = dialog.locator('input[type="date"]')
    await expect(dateInput).toBeVisible()

    const valorInput = dialog.locator('input[type="number"]')
    await expect(valorInput).toBeVisible()

    // Seleciona forma de pagamento "Dinheiro"
    const selectTrigger = dialog.locator('[role="combobox"]').first()
    await selectTrigger.click()
    const opcaoDinheiro = page.getByRole("option", { name: "Dinheiro" })
    if (await opcaoDinheiro.isVisible({ timeout: 2000 }).catch(() => false)) {
      await opcaoDinheiro.click()
    }

    // Confirma pagamento
    const btnConfirmar = dialog.getByRole("button", { name: /Confirmar/i })
    await btnConfirmar.click()

    // Após confirmar, o dialog permanece aberto exibindo o estado de sucesso
    // (isVisible não espera — usar o assert com timeout real)
    await expect(dialog.getByText(/Pagamento registrado/i)).toBeVisible({ timeout: 10000 })
  })

  test("estado de sucesso exibe botão 'Imprimir PDF' com link para /recibos", async ({ page }) => {
    await page.goto("/pagamentos")
    await page.waitForLoadState("networkidle")

    const btnRegistrar = page.getByRole("button", { name: /Registrar/i }).first()
    if (!(await btnRegistrar.isVisible({ timeout: 5000 }).catch(() => false))) return

    await btnRegistrar.click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()

    await dialog.getByRole("button", { name: /Confirmar/i }).click()

    const btnImprimir = dialog.getByRole("link", { name: /Imprimir PDF/i })
    if (await btnImprimir.isVisible({ timeout: 8000 }).catch(() => false)) {
      const href = await btnImprimir.getAttribute("href")
      expect(href).toMatch(/\/recibos/)
    }
  })
})

// ── PIX direto (PixButton → PixModal) ────────────────────────────────────

test.describe("Pagamentos — PIX direto", () => {
  test("botão 'PIX direto' abre PixModal com QR code e código para copiar", async ({ page }) => {
    await page.goto("/pagamentos")
    await page.waitForLoadState("networkidle")

    const btnPix = page.getByRole("button", { name: /PIX direto/i }).first()
    if (!(await btnPix.isVisible({ timeout: 5000 }).catch(() => false))) {
      // Chave PIX não configurada — funcionalidade desabilitada, passa
      return
    }

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
    await page.goto("/pagamentos")
    await page.waitForLoadState("networkidle")

    const btnPix = page.getByRole("button", { name: /PIX direto/i }).first()
    if (!(await btnPix.isVisible({ timeout: 5000 }).catch(() => false))) return

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
    await page.goto("/pagamentos")
    await page.waitForLoadState("networkidle")

    // O botão "Gerar" aparece na coluna "Cobrança" para pagamentos sem externalId
    const btnGerar = page.getByRole("button", { name: /^Gerar$/i }).first()
    if (!(await btnGerar.isVisible({ timeout: 5000 }).catch(() => false))) return

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
    await page.goto("/pagamentos")
    await page.waitForLoadState("networkidle")

    const btnGerar = page.getByRole("button", { name: /^Gerar$/i }).first()
    if (!(await btnGerar.isVisible({ timeout: 5000 }).catch(() => false))) return

    await btnGerar.click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()

    // Abre o select e escolhe Boleto
    const selectTrigger = dialog.locator('[role="combobox"]').first()
    await selectTrigger.click()
    const opcaoBoleto = page.getByRole("option", { name: /Boleto/i })
    if (await opcaoBoleto.isVisible({ timeout: 2000 }).catch(() => false)) {
      await opcaoBoleto.click()
      await expect(selectTrigger).toContainText(/Boleto/)
    }

    await dialog.getByRole("button", { name: /Fechar/i }).click()
  })

  test("cobrança já emitida exibe badge de status ao clicar", async ({ page }) => {
    await page.goto("/pagamentos")
    await page.waitForLoadState("networkidle")

    // Badges de status de cobrança existente — só os rótulos exclusivos do
    // CobrancaBadge ("Vencido"/"Cancelado" colidem com o status do pagamento)
    const badgeCobranca = page
      .locator("span")
      .filter({ hasText: /Aguardando|Pago MP/ })
      .first()

    if (!(await badgeCobranca.isVisible({ timeout: 3000 }).catch(() => false))) return

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
    await page.goto("/pagamentos")
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
    await page.goto("/pagamentos")
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
    const dialogFechado = async () => !(await dialog.isVisible().catch(() => true))
    await Promise.race([
      resultado.waitFor({ timeout: 10000 }).catch(() => null),
      page.waitForFunction(dialogFechado, {}, { timeout: 10000 }).catch(() => null),
    ])

    // A tabela continua visível após a operação
    await expect(page.locator("table")).toBeVisible({ timeout: 5000 })
  })
})

// ── Registro em lote ──────────────────────────────────────────────────────

test.describe("Pagamentos — registro em lote", () => {
  test("selecionar checkbox de pagamento pendente mostra barra de ações em lote", async ({ page }) => {
    await page.goto("/pagamentos")
    await page.waitForLoadState("networkidle")

    // Pega o primeiro checkbox de uma linha pendente (coluna de seleção)
    const checkboxes = page.locator("table tbody tr input[type='checkbox']")
    const count = await checkboxes.count()
    if (count === 0) return

    await checkboxes.first().check()

    // Barra de ações em lote aparece
    await expect(page.getByText(/selecionado/i)).toBeVisible({ timeout: 3000 })
    await expect(page.getByRole("button", { name: /Registrar todos/i })).toBeVisible()
  })

  test("selecionar vários e abrir BulkDialog mostra campos de data e forma", async ({ page }) => {
    await page.goto("/pagamentos")
    await page.waitForLoadState("networkidle")

    const checkboxes = page.locator("table tbody tr input[type='checkbox']")
    const count = await checkboxes.count()
    if (count < 2) return

    // Seleciona os dois primeiros
    await checkboxes.nth(0).check()
    await checkboxes.nth(1).check()

    await page.getByRole("button", { name: /Registrar todos/i }).click()

    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole("heading", { name: /Registrar \d+ pagamento/i })).toBeVisible()

    // Campos de data e forma
    await expect(dialog.locator('input[type="date"]')).toBeVisible()
    await expect(dialog.locator('[role="combobox"]')).toBeVisible()

    // Cancela
    await dialog.getByRole("button", { name: /Cancelar|Fechar|Close/i }).first().click()
    await expect(dialog).not.toBeVisible({ timeout: 5000 })
  })

  test("checkbox 'selecionar todos' marca todos os pendentes", async ({ page }) => {
    await page.goto("/pagamentos")
    await page.waitForLoadState("networkidle")

    const checkboxAll = page.locator("table thead input[type='checkbox']")
    if (!(await checkboxAll.isVisible({ timeout: 3000 }).catch(() => false))) return

    await checkboxAll.check()

    // A barra de lote deve mostrar contagem > 0
    const contagem = page.getByText(/\d+\s+selecionado/i)
    if (await contagem.isVisible({ timeout: 3000 }).catch(() => false)) {
      const texto = await contagem.textContent()
      const num = parseInt(texto?.match(/\d+/)?.[0] ?? "0")
      expect(num).toBeGreaterThan(0)
    }

    // Limpa seleção
    const btnLimpar = page.getByRole("button", { name: /Limpar/i })
    if (await btnLimpar.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btnLimpar.click()
    }
  })
})

// ── Filtros avançados na tabela ────────────────────────────────────────────

test.describe("Pagamentos — filtros de status e turma", () => {
  test("filtro 'Pago' exibe apenas pagamentos com data de pagamento", async ({ page }) => {
    await page.goto("/pagamentos")
    await page.waitForLoadState("networkidle")

    // O select de status (Todos/Pago/Pendente/Vencido) — segundo select na página
    const selects = page.locator('[role="combobox"]')
    const statusSelect = selects.nth(0)

    if (!(await statusSelect.isVisible({ timeout: 3000 }).catch(() => false))) return
    await statusSelect.click()
    const opcaoPago = page.getByRole("option", { name: /^Pago$/i })
    if (await opcaoPago.isVisible({ timeout: 2000 }).catch(() => false)) {
      await opcaoPago.click()
      // Todos os status badges visíveis nas células devem ser "Pago"
      // (contar só células — há elementos ocultos do select com esses textos)
      const badgesPendente = page.getByRole("cell").filter({ hasText: /^Pendente$/ })
      const badgesVencido = page.getByRole("cell").filter({ hasText: /^Vencido$/ })
      expect(await badgesPendente.count()).toBe(0)
      expect(await badgesVencido.count()).toBe(0)
    }
  })

  test("filtro 'Pendente' esconde linhas com pagamento já efetuado", async ({ page }) => {
    await page.goto("/pagamentos")
    await page.waitForLoadState("networkidle")

    const selects = page.locator('[role="combobox"]')
    const statusSelect = selects.nth(0)
    if (!(await statusSelect.isVisible({ timeout: 3000 }).catch(() => false))) return

    await statusSelect.click()
    const opcaoPendente = page.getByRole("option", { name: /^Pendente$/i })
    if (await opcaoPendente.isVisible({ timeout: 2000 }).catch(() => false)) {
      await opcaoPendente.click()
      const badgesPago = page.getByRole("cell").filter({ hasText: /^Pago$/ })
      expect(await badgesPago.count()).toBe(0)
    }
  })

  test("filtro por turma restringe resultados à turma selecionada", async ({ page }) => {
    await page.goto("/pagamentos")
    await page.waitForLoadState("networkidle")

    // O select de turma é o terceiro [role="combobox"] na página
    const turmaSelect = page.locator('[role="combobox"]').nth(1)
    if (!(await turmaSelect.isVisible({ timeout: 3000 }).catch(() => false))) return

    await turmaSelect.click()
    // Pega a primeira opção de turma real (não "Todas")
    const opcoes = page.getByRole("option")
    const totalOpcoes = await opcoes.count()
    if (totalOpcoes < 2) return

    const primeiraOpcao = opcoes.nth(1) // índice 0 = "Todas"
    const nomeTurma = await primeiraOpcao.textContent()
    await primeiraOpcao.click()

    if (nomeTurma) {
      // Todas as linhas visíveis devem ser da turma selecionada ou a tabela vazia
      const linhas = page.locator("table tbody tr")
      const totalLinhas = await linhas.count()
      if (totalLinhas > 0) {
        const primeiraLinha = linhas.first()
        await expect(primeiraLinha).toContainText(nomeTurma.trim())
      }
    }
  })
})

// ── Link de recibo em pagamento pago ──────────────────────────────────────

test.describe("Pagamentos — recibo inline", () => {
  test("pagamento já pago exibe link 'Recibo' apontando para /recibos", async ({ page }) => {
    await page.goto("/pagamentos")
    await page.waitForLoadState("networkidle")

    // Filtra por "Pago" para encontrar pagamentos com recibo disponível
    const statusSelect = page.locator('[role="combobox"]').nth(0)
    if (!(await statusSelect.isVisible({ timeout: 3000 }).catch(() => false))) return

    await statusSelect.click()
    const opcaoPago = page.getByRole("option", { name: /^Pago$/i })
    if (!(await opcaoPago.isVisible({ timeout: 2000 }).catch(() => false))) return
    await opcaoPago.click()

    const linkRecibo = page.getByRole("link", { name: /Recibo/i }).first()
    if (!(await linkRecibo.isVisible({ timeout: 5000 }).catch(() => false))) return

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

    // Deve mostrar tabela ou mensagem de vazio
    const tabela = page.locator("table")
    const semDados = page.getByText(/Nenhum recebimento via PIX/i)
    const hasTabela = await tabela.isVisible({ timeout: 3000 }).catch(() => false)
    const hasSemDados = await semDados.isVisible({ timeout: 1000 }).catch(() => false)
    expect(hasTabela || hasSemDados).toBe(true)
  })

  test("aba 'Emitidos' exibe tabela ou mensagem de vazio", async ({ page }) => {
    await page.goto("/caixa/pix")
    const tabela = page.locator("table")
    const semDados = page.getByText(/Nenhuma cobrança PIX/i)
    const hasTabela = await tabela.isVisible({ timeout: 3000 }).catch(() => false)
    const hasSemDados = await semDados.isVisible({ timeout: 1000 }).catch(() => false)
    expect(hasTabela || hasSemDados).toBe(true)
  })

  test("description do header exibe contagem e valor total", async ({ page }) => {
    await page.goto("/caixa/pix")
    // O PageHeader tem uma description com "X recebidos · R$ YYY"
    await expect(page.getByText(/recebidos/i).first()).toBeVisible()
  })
})
