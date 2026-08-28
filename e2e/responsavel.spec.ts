import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

const RESP_STORAGE = "e2e/.auth/responsavel.json"

// ── Testes sem autenticação (portal público) ───────────────────────────────

test.describe("Portal do Responsável — página de login", () => {
  test("carrega com heading e formulário", async ({ page }) => {
    await page.goto("/responsavel/login")
    await expect(page.getByRole("heading", { name: "Entrar", exact: true })).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test("botão submit desabilitado com campos vazios", async ({ page }) => {
    await page.goto("/responsavel/login")
    await expect(page.locator('button[type="submit"]')).toBeDisabled()
  })

  test("credenciais inválidas mostram mensagem de erro", async ({ page }) => {
    await page.goto("/responsavel/login")
    await page.fill('input[type="email"]', "naoexiste@teste.com")
    await page.fill('input[type="password"]', "senhaerrada")
    await page.click('button[type="submit"]')
    await expect(page.getByText("Credenciais inválidas. Verifique seus dados e tente novamente.", { exact: true })).toBeVisible({ timeout: 5000 })
  })

  test("link 'Esqueceu a senha?' existe e navega para recuperação", async ({ page }) => {
    await page.goto("/responsavel/login")
    await page.getByRole("link", { name: /Esqueceu/i }).click()
    await expect(page).toHaveURL("/responsavel/recuperar-senha")
  })
})

test.describe("Portal do Responsável — página de recuperação de senha", () => {
  test("carrega formulário de email", async ({ page }) => {
    await page.goto("/responsavel/recuperar-senha")
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test("botão de envio está presente", async ({ page }) => {
    await page.goto("/responsavel/recuperar-senha")
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })
})

// ── Testes com responsável criado via admin ────────────────────────────────

test.describe("Portal do Responsável — login com usuário real", () => {
  test("responsável do seed não consegue logar com senha placeholder", async ({ page }) => {
    await page.goto("/responsavel/login")
    await page.fill('input[type="email"]', "resp.aluno1@teste.com")
    await page.fill('input[type="password"]', "seedPlaceholderHashNaoUsarParaLogin")
    await page.click('button[type="submit"]')
    await expect(page.getByText("Credenciais inválidas. Verifique seus dados e tente novamente.", { exact: true })).toBeVisible({ timeout: 5000 })
  })

  test("rota /responsavel sem sessão redireciona para login", async ({ page }) => {
    await page.goto("/responsavel")
    await expect(page).toHaveURL(/\/responsavel\/login/)
  })

  test("rotas protegidas do portal redirecionam sem sessão", async ({ page }) => {
    for (const rota of ["/responsavel/mensalidades", "/responsavel/frequencia", "/responsavel/boletim"]) {
      await page.goto(rota)
      await expect(page).toHaveURL(/\/responsavel\/login/, { timeout: 5000 })
    }
  })
})

// ── Testes do admin sobre responsáveis ────────────────────────────────────

test.describe("Admin — gerenciar responsáveis", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test("lista de responsáveis carrega", async ({ page }) => {
    await page.goto("/configuracoes/responsaveis")
    await expect(page.getByRole("heading", { name: /Responsáveis/i })).toBeVisible()
  })

  test("botão novo responsável abre dialog com campos", async ({ page }) => {
    await page.goto("/configuracoes/responsaveis")
    await page.getByRole("button", { name: /Novo|Adicionar/i }).first().click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('input[type="email"]')).toBeVisible()
    await dialog.getByRole("button", { name: /Cancelar/i }).click()
  })

  test("criar responsável e verificar na lista", async ({ page }) => {
    await page.goto("/configuracoes/responsaveis")
    await page.getByRole("button", { name: /Novo|Adicionar/i }).first().click()

    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    const nomeUnico = `Resp E2E ${Date.now()}`

    // O dialog usa <Label> sem htmlFor — preencher por posição/tipo de input
    const inputs = dialog.locator("input")
    await inputs.nth(0).fill(nomeUnico)             // Nome
    await inputs.nth(1).fill(`resp.${Date.now()}@e2e.test`) // Email
    await inputs.nth(2).fill("11999990001")          // Telefone
    // Senha é o último input de password
    await dialog.locator('input[type="password"]').fill("SenhaSegura@123")

    await dialog.getByRole("button", { name: /Criar|Salvar/i }).click()
    await expect(dialog).not.toBeVisible({ timeout: 10000 })
    await page.reload()
    await expect(page.getByText(nomeUnico)).toBeVisible()
  })
})

// ── Portal autenticado ─────────────────────────────────────────────────────

test.describe("Portal autenticado — dashboard", () => {
  test.use({ storageState: RESP_STORAGE })

  test("mantém Solicitações visível no menu desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1720, height: 900 })
    await page.goto("/responsavel")
    const link = page.getByRole("link", { name: "Solicitações", exact: true })
    await expect(link).toBeVisible()
    const box = await link.boundingBox()
    expect(box).not.toBeNull()
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(1720)
  })

  test("painel de notificações abre inteiro fora do cabeçalho", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto("/responsavel")
    await page.getByRole("button", { name: "Notificações" }).click()

    const dialog = page.getByRole("dialog", { name: "Notificações recentes" })
    await expect(dialog).toBeVisible()
    const visibleAtBottom = await dialog.evaluate((element) => {
      const rect = element.getBoundingClientRect()
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.bottom - 4)
      return hit !== null && element.contains(hit)
    })
    expect(visibleAtBottom).toBe(true)
  })

  test("carrega sem redirecionar para login", async ({ page }) => {
    await page.goto("/responsavel")
    await expect(page).toHaveURL("/responsavel")
  })

  test("exibe saudação com nome do responsável", async ({ page }) => {
    await page.goto("/responsavel")
    await expect(page.getByRole("heading", { name: /Olá,/i })).toBeVisible()
  })

  test("exibe badge 'Portal do Responsável'", async ({ page }) => {
    await page.goto("/responsavel")
    await expect(page.getByText(/Portal do Responsável/i).first()).toBeVisible()
  })
})

test.describe("Portal autenticado — mensalidades", () => {
  test.use({ storageState: RESP_STORAGE })

  test("carrega sem redirecionar para login", async ({ page }) => {
    await page.goto("/responsavel/mensalidades")
    await expect(page).toHaveURL("/responsavel/mensalidades")
  })

  test("exibe heading Mensalidades", async ({ page }) => {
    await page.goto("/responsavel/mensalidades")
    await expect(page.getByRole("heading", { name: /Mensalidades/i })).toBeVisible()
  })
})

test.describe("Portal autenticado — frequencia", () => {
  test.use({ storageState: RESP_STORAGE })

  test("carrega sem redirecionar para login", async ({ page }) => {
    await page.goto("/responsavel/frequencia")
    await expect(page).toHaveURL("/responsavel/frequencia")
  })

  test("exibe heading Frequência", async ({ page }) => {
    await page.goto("/responsavel/frequencia")
    await expect(page.getByRole("heading", { name: /Frequência/i })).toBeVisible()
  })

  test("exibe nome do aluno vinculado", async ({ page }) => {
    await page.goto("/responsavel/frequencia")
    // O globalSetup vincula ao primeiro aluno ativo — deve aparecer na página
    await expect(page.locator("h2").first()).toBeVisible({ timeout: 8000 })
  })
})

test.describe("Portal autenticado — boletim", () => {
  test.use({ storageState: RESP_STORAGE })

  test("carrega sem redirecionar para login", async ({ page }) => {
    await page.goto("/responsavel/boletim")
    await expect(page).toHaveURL("/responsavel/boletim")
  })

  test("exibe heading Boletim", async ({ page }) => {
    await page.goto("/responsavel/boletim")
    await expect(page.getByRole("heading", { name: /Boletim/i })).toBeVisible()
  })

  test("exibe estado de avaliações (com ou sem dados)", async ({ page }) => {
    await page.goto("/responsavel/boletim")
    // Ou mostra avaliações, ou mostra mensagem "Nenhuma avaliação publicada ainda"
    const temAvaliacao = page.getByText(/Período/i)
    const semAvaliacao = page.getByText(/Nenhuma avaliação publicada/i)
    await expect(temAvaliacao.or(semAvaliacao)).toBeVisible({ timeout: 8000 })
  })
})

test.describe("Portal autenticado — carteirinha", () => {
  test.use({ storageState: RESP_STORAGE })

  test("carrega sem redirecionar para login", async ({ page }) => {
    await page.goto("/responsavel/carteirinha")
    await expect(page).toHaveURL("/responsavel/carteirinha")
  })

  test("exibe heading Carteirinhas", async ({ page }) => {
    await page.goto("/responsavel/carteirinha")
    await expect(page.getByRole("heading", { name: /Carteirinhas/i })).toBeVisible()
  })

  test("exibe carteirinha com texto 'CARTEIRINHA DIGITAL'", async ({ page }) => {
    await page.goto("/responsavel/carteirinha")
    await expect(page.getByText(/CARTEIRINHA DIGITAL/i)).toBeVisible({ timeout: 8000 })
  })
})

test.describe("Portal autenticado — desempenho", () => {
  test.use({ storageState: RESP_STORAGE })

  test("carrega sem redirecionar para login", async ({ page }) => {
    await page.goto("/responsavel/desempenho")
    await expect(page).toHaveURL("/responsavel/desempenho")
  })

  test("exibe heading Desempenho dos Atletas", async ({ page }) => {
    await page.goto("/responsavel/desempenho")
    await expect(page.getByRole("heading", { name: /Desempenho/i })).toBeVisible()
  })

  test("exibe card com 'Frequência média'", async ({ page }) => {
    await page.goto("/responsavel/desempenho")
    await expect(page.getByText(/Frequência média/i)).toBeVisible()
  })
})

test.describe("Portal autenticado — classificacao", () => {
  test.use({ storageState: RESP_STORAGE })

  test("carrega sem redirecionar para login", async ({ page }) => {
    await page.goto("/responsavel/classificacao")
    await expect(page).toHaveURL("/responsavel/classificacao")
  })

  test("exibe heading Classificação", async ({ page }) => {
    await page.goto("/responsavel/classificacao")
    await expect(page.locator("h1")).toHaveText("Classificação")
  })

  test("exibe resumo de tabelas no hero", async ({ page }) => {
    await page.goto("/responsavel/classificacao")
    await expect(
      page.getByText("Tabelas", { exact: true }).filter({ visible: true }),
    ).toBeVisible()
  })
})

test.describe("Portal autenticado — jogos", () => {
  test.use({ storageState: RESP_STORAGE })

  test("carrega sem redirecionar para login", async ({ page }) => {
    await page.goto("/responsavel/jogos")
    await expect(page).toHaveURL("/responsavel/jogos")
  })

  test("exibe heading Jogos", async ({ page }) => {
    await page.goto("/responsavel/jogos")
    await expect(page.getByRole("heading", { name: /^Jogos$/i })).toBeVisible()
  })

  test("exibe estado de jogos (com ou sem dados)", async ({ page }) => {
    await page.goto("/responsavel/jogos")
    const temJogos = page.locator("article").first()
    const semJogos = page.getByText(/Nenhum jogo no momento|Sem partidas nesta categoria/i)
    await expect(temJogos.or(semJogos)).toBeVisible({ timeout: 8000 })
  })
})

test.describe("Portal autenticado — galeria", () => {
  test.use({ storageState: RESP_STORAGE })

  test("carrega sem redirecionar para login", async ({ page }) => {
    await page.goto("/responsavel/galeria")
    await expect(page).toHaveURL("/responsavel/galeria")
  })

  test("exibe heading Mural", async ({ page }) => {
    await page.goto("/responsavel/galeria")
    await expect(page.getByRole("heading", { name: /Mural/i })).toBeVisible()
  })
})

test.describe("Portal autenticado — historia", () => {
  test.use({ storageState: RESP_STORAGE })

  test("carrega sem redirecionar para login", async ({ page }) => {
    await page.goto("/responsavel/historia")
    await expect(page).toHaveURL("/responsavel/historia")
  })

  test("exibe heading Nossa História", async ({ page }) => {
    await page.goto("/responsavel/historia")
    await expect(page.getByRole("heading", { name: /Nossa História/i })).toBeVisible()
  })

  test("exibe texto sobre a escolinha", async ({ page }) => {
    await page.goto("/responsavel/historia")
    await expect(page.getByText(/Escolinha Itaquerense/i).first()).toBeVisible()
  })
})

test.describe("Portal autenticado — lojinha", () => {
  test.use({ storageState: RESP_STORAGE })

  test("carrega sem redirecionar para login", async ({ page }) => {
    await page.goto("/responsavel/lojinha")
    await expect(page).toHaveURL("/responsavel/lojinha")
  })

  test("exibe heading Lojinha", async ({ page }) => {
    await page.goto("/responsavel/lojinha")
    await expect(page.getByRole("heading", { name: /Lojinha/i })).toBeVisible()
  })

  test("exibe link para pedido por WhatsApp", async ({ page }) => {
    await page.goto("/responsavel/lojinha")
    await expect(page.getByRole("link", { name: /Quero comprar/i })).toBeVisible()
  })
})

test.describe("Portal autenticado — notificacoes", () => {
  test.use({ storageState: RESP_STORAGE })

  test("carrega sem redirecionar para login", async ({ page }) => {
    await page.goto("/responsavel/notificacoes")
    await expect(page).toHaveURL("/responsavel/notificacoes")
  })

  test("exibe heading Notificações", async ({ page }) => {
    await page.goto("/responsavel/notificacoes")
    // Client component — heading é renderizado no client, aguardar hidratação
    await expect(page.getByRole("heading", { name: /Notificações/i })).toBeVisible({ timeout: 8000 })
  })

  test("exibe lista de tipos de notificação", async ({ page }) => {
    await page.goto("/responsavel/notificacoes")
    await expect(page.getByText(/Mensalidade vencendo/i)).toBeVisible({ timeout: 8000 })
  })
})

test.describe("Portal autenticado — solicitacoes", () => {
  test.use({ storageState: RESP_STORAGE })

  test("carrega sem redirecionar para login", async ({ page }) => {
    await page.goto("/responsavel/solicitacoes")
    await expect(page).toHaveURL("/responsavel/solicitacoes")
  })

  test("exibe link 'Voltar ao portal'", async ({ page }) => {
    await page.goto("/responsavel/solicitacoes")
    await expect(page.getByRole("link", { name: /Voltar ao portal/i })).toBeVisible()
  })

  test("exibe formulário para nova solicitação", async ({ page }) => {
    await page.goto("/responsavel/solicitacoes")
    // Deve haver um select de tipo + textarea de descrição + botão de envio
    await expect(page.locator("select, [role='combobox']").first()).toBeVisible({ timeout: 8000 })
  })
})
