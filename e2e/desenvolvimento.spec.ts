import { expect, test } from "@playwright/test"
import { db } from "@/lib/db"
import { loginAsAdmin } from "./helpers"
import { inicioDaSemana } from "@/lib/desenvolvimento"
import AxeBuilder from "@axe-core/playwright"
import { mesAtualBrasil } from "@/lib/resumo-familiar"

const ATHLETE_NAME = "E2E Aluno Desenvolvimento"
const OPPORTUNITY_ATHLETE = "E2E Atleta Oportunidades"
const OPPORTUNITY_CUP = "E2E Campeonato Oportunidades"

test.describe("Desenvolvimento — admin e mobile", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test.beforeAll(async () => {
    await db.pautaSemanal.deleteMany({ where: { chave: { startsWith: "e2e-pauta-filtros:" }, usuario: "admin_e2e" } })
    await db.pautaSemanal.deleteMany({ where: { turma: "E2E Sub-13", usuario: "admin_e2e" } })
    await db.aluno.deleteMany({ where: { nome: ATHLETE_NAME } })
    await db.aluno.deleteMany({ where: { nome: OPPORTUNITY_ATHLETE } })
    await db.campeonato.deleteMany({ where: { nome: OPPORTUNITY_CUP } })
    const now = new Date()
    const aluno = await db.aluno.create({
      data: {
        nome: ATHLETE_NAME,
        dataNascimento: new Date(now.getFullYear() - 12, 4, 10, 12),
        turma: "E2E Sub-13",
        horario: "Ter/Qui 18h",
        responsavel: "Responsável E2E",
        telefone: "11999990000",
        email: "desenvolvimento@e2e.test",
        dataMatricula: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), 12),
        mensalidade: 150,
        status: "Ativo",
      },
    })
    const anterior = new Date(now.getTime() - 7 * 86400000)
    await db.acaoDesenvolvimento.create({ data: {
      alunoId: aluno.id,
      insightKey: `${aluno.id}:avaliacao_atrasada:${inicioDaSemana(anterior)}`,
      tipo: "avaliacao_atrasada", titulo: "Avaliação do ciclo anterior", acao: "Revisar avaliação",
      status: "concluida", observacao: "E2E Resultado da semana anterior", usuario: "admin_e2e",
      concluidaEm: anterior,
    } })
    const daysAgo = (days: number) => new Date(now.getTime() - days * 86400000)
    await db.aluno.create({ data: {
      nome: OPPORTUNITY_ATHLETE, dataNascimento: daysAgo(365 * 12),
      turma: "E2E Sub-13", horario: "Ter/Qui 18h", responsavel: "Responsável E2E",
      telefone: "11999990000", email: "oportunidades@e2e.test", dataMatricula: daysAgo(365), mensalidade: 150, status: "Ativo",
      frequencias: { create: [1, 2, 3, 4, 5].map((days) => ({ data: daysAgo(days), presenca: "Presente" })) },
      inscricoes: { create: {
        createdAt: daysAgo(30),
        campeonato: { create: {
          nome: OPPORTUNITY_CUP, dataInicio: daysAgo(60),
          partidas: { create: [
            { data: daysAgo(5), adversario: "E2E Adversário", resultado: "Vitoria" },
            { data: daysAgo(40), adversario: "E2E Antes da inscrição", resultado: "Empate" },
            { data: daysAgo(3), adversario: "E2E Sem resultado" },
          ] },
        } },
      } },
    } })
  })

  test.afterAll(async () => {
    await db.pautaSemanal.deleteMany({ where: { chave: { startsWith: "e2e-pauta-filtros:" }, usuario: "admin_e2e" } })
    await db.pautaSemanal.deleteMany({ where: { turma: "E2E Sub-13", usuario: "admin_e2e" } })
    await db.log.deleteMany({ where: { tipo: "pauta_semanal_salva", descricao: "Pauta semanal revisada — E2E Sub-13", usuario: "admin_e2e" } })
    await db.log.deleteMany({ where: { tipo: "resumo_familiar_salvo", descricao: `Resumo familiar revisado — ${OPPORTUNITY_ATHLETE}`, usuario: "admin_e2e" } })
    await db.aluno.deleteMany({ where: { nome: ATHLETE_NAME } })
    await db.aluno.deleteMany({ where: { nome: OPPORTUNITY_ATHLETE } })
    await db.campeonato.deleteMany({ where: { nome: OPPORTUNITY_CUP } })
  })

  test("explica o indicador, grava a fila semanal e não cria overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/desenvolvimento")

    await expect(page.getByRole("heading", { name: "Desenvolvimento", level: 1 })).toBeVisible()
    const athleteCard = page.getByRole("article").filter({ hasText: ATHLETE_NAME })
    await expect(athleteCard.getByText("Avaliação de desenvolvimento pendente")).toBeVisible()
    await expect(athleteCard.getByText("Nenhuma avaliação registrada")).toBeVisible()
    await expect(athleteCard.getByRole("button", { name: "Preparar plano" })).toBeVisible()

    await athleteCard.getByRole("button", { name: "Adicionar à fila" }).click()
    await page.getByRole("button", { name: "Confirmar" }).click()
    await expect(athleteCard.getByText("Na fila", { exact: true })).toBeVisible()

    const history = page.getByRole("region", { name: "Histórico de ciclos" })
    await expect(history.getByText("E2E Resultado da semana anterior", { exact: false })).toBeVisible()
    await athleteCard.getByRole("button", { name: "Marcar concluída" }).click()
    await expect(page.getByRole("button", { name: "Confirmar", exact: true })).toBeDisabled()
    await page.getByLabel("Resultado da ação (obrigatório)").fill("E2E Família contatada e retorno combinado")
    await page.getByRole("button", { name: "Confirmar", exact: true }).click()
    await expect(history.getByText("E2E Família contatada e retorno combinado", { exact: false })).toBeVisible()
    await page.reload()
    await expect(history.getByText("E2E Família contatada e retorno combinado", { exact: false })).toBeVisible()

    const layout = await page.evaluate(() => ({
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
    }))
    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewport)
    await athleteCard.getByRole("link", { name: new RegExp(ATHLETE_NAME) }).click()
    await expect(page).toHaveURL(/\/alunos\/\d+$/, { timeout: 15_000 })
    const passport = page.getByRole("region", { name: "Histórico de acompanhamento do atleta" })
    await expect(passport.getByText("E2E Família contatada e retorno combinado", { exact: false })).toBeVisible()
    await expect(passport.getByText("E2E Resultado da semana anterior", { exact: false })).toBeVisible()
  })

  test("filtra oportunidades por turma com recorte consistente e acessível no mobile", async ({ page }) => {
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/desenvolvimento/inteligencia")
    const panel = page.getByRole("region", { name: "Equidade de oportunidades" })
    await panel.getByLabel("Turma de acompanhamento").selectOption("E2E Sub-13")
    await expect(panel.getByRole("status")).toHaveText("2 atleta(s) na lista, em ordem alfabética.")
    await panel.getByLabel("Buscar atleta nas oportunidades").fill(OPPORTUNITY_ATHLETE)
    await expect(panel.getByRole("status")).toHaveText("1 atleta(s) na lista, em ordem alfabética.")
    await expect(panel.getByText("Revisar oportunidade", { exact: true })).toBeVisible()
    await expect(panel.getByText("0 em 1 jogo(s)", { exact: true })).toBeVisible()
    await panel.getByText("Como interpretar estes dados", { exact: true }).click()
    await expect(panel.getByText(/Uma convocação não comprova participação/)).toBeVisible()
    const accessibility = await new AxeBuilder({ page }).include('[aria-labelledby="opportunities-title"]').withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()
    expect(accessibility.violations).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await panel.getByLabel("Buscar atleta nas oportunidades").fill("E2E Nome inexistente xyz")
    await expect(panel.getByText("Nenhum atleta neste filtro.")).toBeVisible()
    await panel.getByLabel("Buscar atleta nas oportunidades").fill(ATHLETE_NAME)
    await expect(panel.getByText("Sem registros", { exact: true })).toBeVisible()
    await expect(panel.getByText("Sem jogos para analisar", { exact: true })).toBeVisible()
    await panel.getByRole("link", { name: ATHLETE_NAME }).click()
    await expect(page).toHaveURL(/\/alunos\/\d+$/)
    await page.goto("/desenvolvimento")
    const indicator = page.getByRole("article").filter({ hasText: OPPORTUNITY_ATHLETE }).filter({ hasText: "Boa presença sem convocação recente" })
    await expect(indicator.getByText("0 convocações em 1 jogo(s) registrado(s) no período")).toBeVisible()
    expect(errors).toEqual([])
  })

  test("mantém rótulos acima dos filtros e controles alinhados em diferentes larguras", async ({ page }) => {
    await page.goto("/desenvolvimento/inteligencia")
    const panel = page.getByRole("region", { name: "Equidade de oportunidades" })
    for (const width of [320, 390, 640, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 })
      const turma = panel.getByLabel("Turma de acompanhamento")
      const busca = panel.getByLabel("Buscar atleta nas oportunidades")
      await expect(turma).toBeVisible()
      await expect(busca).toBeVisible()
      const selectBox = (await turma.boundingBox())!
      const inputBox = (await busca.boundingBox())!
      const turmaLabel = (await panel.locator('label[for="opportunities-class"]').boundingBox())!
      const buscaLabel = (await panel.locator('label[for="opportunities-search"]').boundingBox())!
      expect(turmaLabel.y + turmaLabel.height).toBeLessThan(selectBox.y)
      expect(buscaLabel.y + buscaLabel.height).toBeLessThan(inputBox.y)
      expect(Math.abs(turmaLabel.x - selectBox.x)).toBeLessThan(1)
      expect(Math.abs(buscaLabel.x - inputBox.x)).toBeLessThan(1)
      expect(selectBox.height).toBeGreaterThanOrEqual(44)
      expect(inputBox.height).toBeGreaterThanOrEqual(44)
      if (width >= 640) {
        expect(Math.abs(selectBox.y - inputBox.y)).toBeLessThan(1)
        expect(selectBox.x + selectBox.width).toBeLessThan(inputBox.x)
      } else {
        expect(selectBox.y + selectBox.height).toBeLessThan(buscaLabel.y)
        expect(Math.abs(selectBox.width - inputBox.width)).toBeLessThan(1)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    }
  })

  test("prepara resumo mensal revisável no mobile sem publicar nem enviar", async ({ page }) => {
    const aluno = await db.aluno.findFirstOrThrow({ where: { nome: OPPORTUNITY_ATHLETE }, select: { id: true } })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/alunos/${aluno.id}`)
    await page.getByRole("button", { name: "Preparar resumo mensal para a família" }).click()
    const dialog = page.getByRole("dialog", { name: "Resumo mensal para a família" })
    await dialog.getByLabel("Mês do resumo").selectOption(mesAtualBrasil())
    await dialog.getByRole("button", { name: "Preparar rascunho" }).click()
    const texto = dialog.getByLabel("Texto para revisão")
    await expect(texto).toHaveValue(new RegExp(OPPORTUNITY_ATHLETE))
    await expect(texto).toHaveValue(/dados parciais/)
    const copiar = dialog.getByRole("button", { name: "Copiar resumo revisado" })
    await expect(copiar).toBeDisabled()
    const revisao = dialog.getByRole("checkbox", { name: "Revisei o texto e os dados antes de compartilhar." })
    await revisao.check()
    await expect(copiar).toBeEnabled()
    await texto.fill("Resumo E2E revisado pela comissão técnica para a família.")
    await expect(revisao).not.toBeChecked()
    await expect(copiar).toBeDisabled()
    await revisao.check()
    await copiar.click()
    await expect(page.getByText("Resumo copiado. Nenhuma mensagem foi enviada.", { exact: true })).toBeVisible()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("Resumo E2E revisado pela comissão técnica para a família.")
    const a11y = await new AxeBuilder({ page }).include('[role="dialog"]').withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()
    expect(a11y.violations).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await dialog.getByLabel("Mês do resumo").selectOption({ index: 1 })
    await expect(texto).toHaveValue("Resumo E2E revisado pela comissão técnica para a família.")
    await expect(copiar).toBeDisabled()
    await expect(dialog.getByRole("button", { name: "Preparar rascunho" })).toBeDisabled()
    await expect(dialog.getByRole("button", { name: "Salvar versão revisada" })).toBeDisabled()
    await dialog.getByRole("button", { name: "Fechar", exact: true }).click()
  })

  test("salva versões sem sobrescrever e recupera o histórico após recarregar", async ({ page }) => {
    const aluno = await db.aluno.findFirstOrThrow({ where: { nome: OPPORTUNITY_ATHLETE }, select: { id: true } })
    const primeira = "E2E Primeira versão revisada, preservada para consulta da equipe."
    const segunda = "E2E Segunda versão revisada, com novo contexto para a equipe."
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/alunos/${aluno.id}`)
    const dialog = page.getByRole("dialog", { name: "Resumo mensal para a família" })
    const abrir = async () => {
      await page.getByRole("button", { name: "Preparar resumo mensal para a família" }).click()
      await dialog.getByLabel("Mês do resumo").selectOption(mesAtualBrasil())
      await dialog.getByRole("button", { name: "Preparar rascunho" }).click()
      await expect(dialog.getByLabel("Texto para revisão")).toBeVisible()
    }
    const salvar = async (texto: string) => {
      await dialog.getByLabel("Texto para revisão").fill(texto)
      await expect(dialog.getByRole("button", { name: "Salvar versão revisada", exact: true })).toBeDisabled()
      await dialog.getByRole("checkbox", { name: "Revisei o texto e os dados antes de compartilhar." }).check()
      await dialog.getByRole("button", { name: "Salvar versão revisada", exact: true }).click()
      await expect(dialog.getByRole("button", { name: "Versão salva", exact: true })).toBeDisabled()
    }
    await abrir()
    await salvar(primeira)
    await page.reload()
    await abrir()
    await salvar(primeira)
    expect(await db.resumoFamiliar.count({ where: { alunoId: aluno.id } })).toBe(1)
    await salvar(segunda)
    expect(await db.resumoFamiliar.count({ where: { alunoId: aluno.id } })).toBe(2)
    await page.reload()
    await page.getByRole("button", { name: "Preparar resumo mensal para a família" }).click()
    await dialog.getByRole("button", { name: "Consultar versões salvas" }).click()
    const historico = dialog.getByRole("region", { name: "Versões salvas pela equipe" })
    await expect(historico.locator("details")).toHaveCount(2)
    await historico.locator("summary").nth(0).click()
    await expect(historico.getByText(segunda, { exact: true })).toBeVisible()
    await historico.locator("summary").nth(1).click()
    await expect(historico.getByText(primeira, { exact: true })).toBeVisible()
    await expect(historico.locator("summary").nth(0)).toContainText("admin_e2e")
    const a11y = await new AxeBuilder({ page }).include('[role="dialog"]').withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()
    expect(a11y.violations).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    const outro = await db.aluno.findFirstOrThrow({ where: { nome: ATHLETE_NAME }, select: { id: true } })
    await page.goto(`/alunos/${outro.id}`)
    await page.getByRole("button", { name: "Preparar resumo mensal para a família" }).click()
    await dialog.getByRole("button", { name: "Consultar versões salvas" }).click()
    await expect(dialog.getByText("Nenhum resumo salvo para este atleta.")).toBeVisible()
    await expect(dialog.getByText(primeira, { exact: true })).toHaveCount(0)
  })

  test("preserva resumo ao trocar mês, falhar a preparação e cancelar a recarga", async ({ page }) => {
    const aluno = await db.aluno.findFirstOrThrow({ where: { nome: OPPORTUNITY_ATHLETE }, select: { id: true } })
    const quantidade = await db.resumoFamiliar.count({ where: { alunoId: aluno.id } })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/alunos/${aluno.id}`)
    const abrir = page.getByRole("button", { name: "Preparar resumo mensal para a família" })
    await abrir.click()
    const dialog = page.getByRole("dialog", { name: "Resumo mensal para a família" })
    const mes = dialog.getByLabel("Mês do resumo")
    const preparar = dialog.getByRole("button", { name: "Preparar rascunho" })
    await mes.selectOption(mesAtualBrasil())
    await preparar.click()
    const texto = dialog.getByLabel("Texto para revisão")
    const editado = "E2E Resumo que deve ser preservado mesmo ao consultar outro mês."
    await texto.fill(editado)
    await mes.selectOption({ index: 1 })
    await expect(texto).toHaveValue(editado)
    await expect(preparar).toBeDisabled()
    const substituicao = dialog.getByRole("checkbox", { name: "Permitir substituir minhas edições ao preparar outro resumo." })
    await substituicao.check()
    const caminho = `**/alunos/${aluno.id}`
    await page.route(caminho, (route) => route.request().method() === "POST" ? route.abort("failed") : route.continue())
    await preparar.click()
    await expect(page.getByText("Não foi possível preparar o resumo. Verifique sua sessão e tente novamente.", { exact: true })).toBeVisible()
    await page.unroute(caminho)
    await expect(texto).toHaveValue(editado)
    await expect(dialog.getByText(/^O texto abaixo ainda pertence a/)).toBeVisible()
    await mes.selectOption(mesAtualBrasil())
    const revisao = dialog.getByRole("checkbox", { name: "Revisei o texto e os dados antes de compartilhar." })
    await revisao.check()
    await dialog.getByRole("button", { name: "Fechar", exact: true }).click()
    await expect(page.getByText(/^Há alterações não salvas no resumo familiar\./)).toBeVisible()
    const aviso = page.waitForEvent("dialog")
    await page.evaluate(() => { setTimeout(() => window.location.reload(), 0) })
    const confirmacao = await aviso
    expect(confirmacao.type()).toBe("beforeunload")
    await confirmacao.dismiss()
    await abrir.click()
    await expect(texto).toHaveValue(editado)
    await expect(revisao).toBeChecked()
    await dialog.getByRole("button", { name: "Salvar versão revisada" }).click()
    await expect(dialog.getByRole("button", { name: "Versão salva", exact: true })).toBeDisabled()
    expect(await db.resumoFamiliar.count({ where: { alunoId: aluno.id } })).toBe(quantidade + 1)
    const salvo = await db.resumoFamiliar.findFirstOrThrow({ where: { alunoId: aluno.id, texto: editado } })
    expect(salvo.mes).toBe(mesAtualBrasil())
    await page.reload()
    await abrir.click()
    await mes.selectOption(mesAtualBrasil())
    await preparar.click()
    await texto.fill(editado)
    await mes.selectOption({ index: 1 })
    await substituicao.check()
    await texto.fill(`${editado} Nova edição.`)
    await expect(substituicao).not.toBeChecked()
    await expect(preparar).toBeDisabled()
    await substituicao.check()
    await preparar.click()
    await expect(texto).not.toHaveValue(/E2E Resumo que deve ser preservado/)
    await expect(texto).toHaveValue(new RegExp(OPPORTUNITY_ATHLETE))
    await expect(revisao).not.toBeChecked()
    await expect(dialog.getByText(/^O texto abaixo ainda pertence a/)).toHaveCount(0)
    await expect(dialog.getByText(/^Alterações não salvas no resumo\./)).toHaveCount(0)
    const a11y = await new AxeBuilder({ page }).include('[role="dialog"]').withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()
    expect(a11y.violations).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })

  test("bloqueia resumo com base antiga e atualiza os registros sem apagar o texto", async ({ page }) => {
    const aluno = await db.aluno.findFirstOrThrow({ where: { nome: OPPORTUNITY_ATHLETE }, select: { id: true } })
    const quantidade = await db.resumoFamiliar.count({ where: { alunoId: aluno.id } })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/alunos/${aluno.id}`)
    await page.getByRole("button", { name: "Preparar resumo mensal para a família" }).click()
    const dialog = page.getByRole("dialog", { name: "Resumo mensal para a família" })
    await dialog.getByLabel("Mês do resumo").selectOption(mesAtualBrasil())
    await dialog.getByRole("button", { name: "Preparar rascunho" }).click()
    const texto = dialog.getByLabel("Texto para revisão")
    const editado = "E2E Resumo editado pela equipe antes da mudança dos registros de frequência."
    await texto.fill(editado)
    const revisao = dialog.getByRole("checkbox", { name: "Revisei o texto e os dados antes de compartilhar." })
    await revisao.check()
    const hoje = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date())
    await db.frequencia.create({ data: { alunoId: aluno.id, data: new Date(`${hoje}T12:00:00Z`), presenca: "Ausente" } })
    const salvar = dialog.getByRole("button", { name: "Salvar versão revisada" })
    await salvar.click()
    await expect(dialog.getByRole("alert")).toContainText("Os registros do mês mudaram")
    await expect(texto).toHaveValue(editado)
    await expect(revisao).not.toBeChecked()
    await expect(revisao).toBeDisabled()
    await expect(salvar).toBeDisabled()
    await expect(dialog.getByRole("button", { name: "Copiar resumo revisado" })).toBeDisabled()
    expect(await db.resumoFamiliar.count({ where: { alunoId: aluno.id } })).toBe(quantidade)
    const atualizar = dialog.getByRole("button", { name: "Atualizar base mantendo texto" })
    const caminho = `**/alunos/${aluno.id}`
    await page.route(caminho, (route) => route.request().method() === "POST" ? route.abort("failed") : route.continue())
    await atualizar.click()
    await expect(page.getByText("Não foi possível preparar o resumo. Verifique sua sessão e tente novamente.", { exact: true })).toBeVisible()
    await page.unroute(caminho)
    await expect(texto).toHaveValue(editado)
    await expect(dialog.getByRole("alert")).toBeVisible()
    await atualizar.click()
    await expect(dialog.getByRole("alert")).toHaveCount(0)
    await expect(texto).toHaveValue(editado)
    await expect(dialog.getByText(/^A base foi atualizada, mas o texto foi mantido\./)).toBeVisible()
    await expect(dialog.getByText(/1 ausência\(s\)/)).toBeVisible()
    await expect(salvar).toBeDisabled()
    await expect(revisao).toBeEnabled()
    await texto.fill(`${editado} A ausência registrada foi conferida nesta revisão.`)
    await revisao.check()
    await salvar.click()
    await expect(dialog.getByRole("button", { name: "Versão salva", exact: true })).toBeDisabled()
    expect(await db.resumoFamiliar.count({ where: { alunoId: aluno.id } })).toBe(quantidade + 1)
    const a11y = await new AxeBuilder({ page }).include('[role="dialog"]').withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()
    expect(a11y.violations).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })

  test("encerra ação antiga fora do histórico recente e protege contra tela desatualizada", async ({ page }) => {
    test.setTimeout(60_000)
    const aluno = await db.aluno.findFirstOrThrow({ where: { nome: ATHLETE_NAME }, select: { id: true } })
    const anterior = new Date(Date.now() - 200 * 86400000)
    const antiga = await db.acaoDesenvolvimento.create({ data: {
      alunoId: aluno.id, insightKey: `${aluno.id}:tipo_antigo:2020-01-06`, titulo: "E2E Pendência antiga sem indicador", tipo: "tipo_antigo", acao: "Retomar conversa", status: "pendente", updatedAt: anterior,
    } })
    await db.acaoDesenvolvimento.createMany({ data: Array.from({ length: 45 }, (_, i) => ({
      alunoId: aluno.id, insightKey: `${aluno.id}:e2e_encerrada_${i}:2026-01-01`, titulo: `E2E Ciclo encerrado ${i}`, tipo: "e2e", acao: "Encerrada", status: "concluida", updatedAt: new Date(Date.now() - 2 * 86400000),
    })) })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/desenvolvimento")
    await expect(page.getByRole("region", { name: "Histórico de ciclos" }).getByText(antiga.titulo)).toHaveCount(0)
    await page.goto(`/alunos/${aluno.id}`)
    const pendencias = page.getByRole("region", { name: "Pendências de todos os ciclos" })
    await pendencias.getByRole("button", { name: "Consultar pendências", exact: true }).click()
    await expect(pendencias.getByText(antiga.titulo, { exact: true })).toBeVisible()
    await pendencias.getByRole("button", { name: "Concluir pendência", exact: true }).click()
    const dialog = page.getByRole("dialog", { name: "Concluir pendência registrada" })
    await expect(dialog.getByRole("button", { name: "Confirmar encerramento" })).toBeDisabled()
    await dialog.getByLabel("Resultado da pendência").fill("E2E Conversa retomada e acompanhamento concluído")
    const a11y = await new AxeBuilder({ page }).include('[role="dialog"]').withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()
    expect(a11y.violations).toEqual([])
    await dialog.getByRole("button", { name: "Confirmar encerramento" }).click()
    await expect(dialog).toHaveCount(0)
    await expect(pendencias.getByText(antiga.titulo, { exact: true })).toHaveCount(0)
    await page.reload()
    await expect(page.getByRole("region", { name: "Histórico de acompanhamento do atleta" }).getByText("E2E Conversa retomada e acompanhamento concluído", { exact: false })).toBeVisible()
    expect(await db.acaoDesenvolvimento.findUnique({ where: { id: antiga.id } })).toMatchObject({ status: "concluida", insightKey: antiga.insightKey })

    const concorrente = await db.acaoDesenvolvimento.create({ data: {
      alunoId: aluno.id, insightKey: `${aluno.id}:concorrente:2020-01-06`, titulo: "E2E Pendência concorrente", tipo: "antiga", acao: "Revisar", status: "pendente",
    } })
    await pendencias.getByRole("button", { name: "Consultar pendências", exact: true }).click()
    await pendencias.getByRole("button", { name: "Ignorar pendência", exact: true }).click()
    const ignorar = page.getByRole("dialog", { name: "Ignorar pendência registrada" })
    await ignorar.getByLabel("Justificativa da pendência").fill("Texto da tela antiga que não pode sobrescrever")
    await db.acaoDesenvolvimento.update({ where: { id: concorrente.id }, data: { observacao: "E2E Registro de outro técnico", updatedAt: new Date(concorrente.updatedAt.getTime() + 1) } })
    await ignorar.getByRole("button", { name: "Confirmar encerramento" }).click()
    await expect(ignorar.getByRole("alert")).toContainText("alterada ou encerrada por outra pessoa")
    await expect(ignorar.getByLabel("Justificativa da pendência")).toHaveValue("Texto da tela antiga que não pode sobrescrever")
    expect(await db.acaoDesenvolvimento.findUnique({ where: { id: concorrente.id } })).toMatchObject({ status: "pendente", observacao: "E2E Registro de outro técnico" })
    await ignorar.getByRole("button", { name: "Cancelar", exact: true }).click()
    await pendencias.getByRole("button", { name: "Atualizar pendências", exact: true }).click()
    await expect(pendencias.getByText("E2E Registro de outro técnico", { exact: false })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })

  test("atualiza o cartão semanal quando a pendência atual é encerrada pelo histórico", async ({ page }) => {
    const aluno = await db.aluno.findFirstOrThrow({ where: { nome: ATHLETE_NAME }, select: { id: true } })
    const insightKey = `${aluno.id}:avaliacao_atrasada:${inicioDaSemana(new Date())}`
    await db.acaoDesenvolvimento.upsert({ where: { insightKey },
      create: { alunoId: aluno.id, insightKey, tipo: "avaliacao_atrasada", titulo: "Avaliação de desenvolvimento pendente", acao: "Agendar avaliação", status: "pendente" },
      update: { status: "pendente" },
    })
    await page.goto("/desenvolvimento")
    const card = page.getByRole("article").filter({ hasText: ATHLETE_NAME })
    await expect(card.getByText("Na fila", { exact: true })).toBeVisible()
    const row = page.getByRole("region", { name: "Histórico de ciclos" }).getByRole("listitem").filter({ has: page.getByText("Avaliação de desenvolvimento pendente", { exact: true }) })
    await row.getByRole("button", { name: "Concluir pendência", exact: true }).click()
    await page.getByLabel("Resultado da pendência").fill("E2E Avaliação agendada e acompanhamento finalizado")
    await page.getByRole("button", { name: "Confirmar encerramento" }).click()
    await expect(card.getByText("Concluída", { exact: true })).toBeVisible()
    await expect(card.getByRole("button", { name: "Marcar concluída" })).toHaveCount(0)
  })

  test("compara frequência com evidências e não atribui causalidade à ação", async ({ page }) => {
    const aluno = await db.aluno.findFirstOrThrow({ where: { nome: OPPORTUNITY_ATHLETE }, select: { id: true } })
    const now = new Date()
    const dia = new Date(now.getTime() - 40 * 86400000)
    dia.setUTCHours(15, 0, 0, 0)
    const civil = new Date(dia.toISOString().slice(0, 10))
    await db.frequencia.createMany({ data: [-4, -3, -2, -1, 1, 2, 3, 4].map((offset) => ({ alunoId: aluno.id, data: new Date(civil.getTime() + offset * 86400000), presenca: offset < -2 || offset === 4 ? "Ausente" : "Presente" })) })
    const completa = await db.acaoDesenvolvimento.create({ data: {
      alunoId: aluno.id, insightKey: `${aluno.id}:comparacao_e2e:2020-01-06`, tipo: "baixa_frequencia", titulo: "E2E Comparação de frequência", acao: "Conversar", status: "concluida", concluidaEm: dia,
    } })
    await db.acaoDesenvolvimento.create({ data: {
      alunoId: aluno.id, insightKey: `${aluno.id}:observacao_e2e:2020-01-06`, tipo: "baixa_frequencia", titulo: "E2E Período em observação", acao: "Conversar", status: "concluida", concluidaEm: now,
    } })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/alunos/${aluno.id}`)
    const history = page.getByRole("region", { name: "Histórico de acompanhamento do atleta" })
    const row = history.getByRole("listitem").filter({ has: page.getByText("E2E Comparação de frequência", { exact: true }) })
    await row.getByRole("button", { name: "Ver frequência antes/depois" }).click()
    await expect(row.getByText("50%", { exact: true })).toBeVisible()
    await expect(row.getByText("75%", { exact: true })).toBeVisible()
    await expect(row.getByText("Variação da presença registrada: +25 pontos percentuais.")).toBeVisible()
    await expect(row.getByText(/Esta comparação não comprova efeito da ação/)).toBeVisible()
    const a11y = await new AxeBuilder({ page }).include(`#attendance-followup-${completa.id}`).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()
    expect(a11y.violations).toEqual([])
    const parcial = history.getByRole("listitem").filter({ has: page.getByText("E2E Período em observação", { exact: true }) })
    await parcial.getByRole("button", { name: "Ver frequência antes/depois" }).click()
    await expect(parcial.getByText("Em observação: 0 de 30 dias completos após a conclusão.")).toBeVisible()
    await expect(parcial.getByText(/Variação da presença registrada:/)).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await row.getByRole("button", { name: "Ocultar comparação" }).click()
    await expect(row.getByRole("region", { name: "Frequência antes e depois da ação" })).toHaveCount(0)
  })

  test("personaliza o copiloto local, preserva edições em falhas e exige revisão no mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/desenvolvimento")
    const card = page.getByRole("article").filter({ hasText: ATHLETE_NAME }).filter({ hasText: "Avaliação de desenvolvimento pendente" })
    await card.getByRole("button", { name: "Preparar plano" }).click()
    const dialog = page.getByRole("dialog", { name: "Copiloto de desenvolvimento" })
    const plano = dialog.getByLabel("Plano da semana", { exact: true })
    const mensagem = dialog.getByLabel("Rascunho para a família", { exact: true })
    const salvar = dialog.getByRole("button", { name: "Aprovar e salvar na fila" })
    const copiar = dialog.getByRole("button", { name: "Copiar", exact: true })
    const revisao = dialog.getByRole("checkbox", { name: "Revisei o plano e a mensagem antes de copiar ou salvar." })
    const aluno = await db.aluno.findFirstOrThrow({ where: { nome: ATHLETE_NAME }, select: { id: true } })
    const key = `${aluno.id}:avaliacao_atrasada:${inicioDaSemana(new Date())}`
    // Abrir o diálogo não gera nem grava: a preparação depende de ação explícita.
    await expect(plano).toHaveCount(0)
    await expect(dialog.getByText(/A geração só começa ao clicar no botão/)).toBeVisible()
    await expect(salvar).toBeDisabled()
    await expect(dialog.getByLabel("Modo de geração")).toHaveValue("local")
    await expect(dialog.getByLabel("Modo de geração").locator('option[value="ia"]')).toHaveCount(0)
    await expect(dialog.getByText(/A IA externa está desativada/)).toBeVisible()
    await dialog.getByLabel("Foco do próximo rascunho").selectOption("familia")
    await dialog.getByRole("button", { name: "Gerar rascunho", exact: true }).click()
    await expect(plano).toHaveValue(/ouvir seu contexto/)
    await expect(dialog.getByText("Origem: modelo local (sem IA)", { exact: true })).toBeVisible()
    await expect(mensagem).toHaveValue(new RegExp(ATHLETE_NAME))
    await expect(copiar).toBeDisabled()
    await expect(salvar).toBeDisabled()
    await revisao.check()
    await expect(salvar).toBeEnabled()
    await mensagem.fill("Mensagem E2E revisada para combinar uma conversa com a família nesta semana.")
    await expect(revisao).not.toBeChecked()
    await expect(copiar).toBeDisabled()
    const outra = dialog.getByRole("button", { name: "Gerar outra versão" })
    await expect(outra).toBeDisabled()
    await dialog.getByRole("checkbox", { name: "Permitir substituir minhas edições ao gerar outra versão." }).check()
    await page.route("**/desenvolvimento", async (route) => {
      if (route.request().method() === "POST") await route.abort("failed")
      else await route.continue()
    })
    await outra.click()
    await expect(dialog.getByRole("alert")).toContainText("Seu texto anterior foi preservado")
    await expect(mensagem).toHaveValue("Mensagem E2E revisada para combinar uma conversa com a família nesta semana.")
    await page.unroute("**/desenvolvimento")
    await dialog.getByLabel("Foco do próximo rascunho").selectOption("treino")
    await outra.click()
    await expect(plano).toHaveValue(/treino habitual/)
    await expect(revisao).not.toBeChecked()
    await expect(dialog.getByRole("alert")).toHaveCount(0)
    await revisao.check()
    await copiar.click()
    await expect(page.getByText("Mensagem copiada. Nenhuma mensagem foi enviada.", { exact: true })).toBeVisible()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await mensagem.inputValue())
    const a11y = await new AxeBuilder({ page }).include('[role="dialog"]').withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()
    expect(a11y.violations).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    const planoSalvo = await plano.inputValue()
    await salvar.click()
    await expect(dialog).toHaveCount(0)
    await expect(card.getByText("Plano aprovado", { exact: true })).toBeVisible()
    const acao = await db.acaoDesenvolvimento.findUniqueOrThrow({ where: { insightKey: key } })
    expect(acao.rascunhoFonte).toBe("modelo_local")
    expect(acao.planoSemanal).toContain("treino habitual")
    await page.reload()
    await card.getByRole("button", { name: "Abrir plano" }).click()
    await expect(plano).toHaveValue(planoSalvo)
    await expect(revisao).not.toBeChecked()
    await expect(salvar).toBeDisabled()
  })

  test("prepara pauta local da turma sem requisições de geração e exige revisão", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/desenvolvimento")
    // A pauta usa a turma inteira, mesmo quando a fila está filtrada por outro nome.
    await page.getByLabel("Buscar indicador").fill("Nome que não existe E2E")
    await page.getByRole("button", { name: "Preparar pauta por turma" }).click()
    const dialog = page.getByRole("dialog", { name: "Pauta semanal por turma" })
    const turma = dialog.getByLabel("Turma da pauta")
    await turma.selectOption("E2E Sub-13")
    const posts: string[] = []
    page.on("request", (request) => { if (request.method() === "POST") posts.push(request.url()) })
    await dialog.getByRole("button", { name: "Preparar pauta", exact: true }).click()
    const texto = dialog.getByLabel("Pauta para revisão")
    await expect(texto).toHaveValue(/Turma: E2E Sub-13/)
    await expect(texto).toHaveValue(/Atletas ativos na turma: 2/)
    await expect(texto).toHaveValue(new RegExp(ATHLETE_NAME))
    await expect(texto).not.toHaveValue(/E2E Resultado da semana anterior/)
    const revisao = dialog.getByRole("checkbox", { name: "Revisei a pauta para uso interno da comissão." })
    const copiar = dialog.getByRole("button", { name: "Copiar pauta revisada" })
    await expect(copiar).toBeDisabled()
    await revisao.check()
    await texto.fill(`${await texto.inputValue()}\nE2E Próximo encontro combinado pela comissão.`)
    await expect(revisao).not.toBeChecked()
    await expect(copiar).toBeDisabled()
    const atualizar = dialog.getByRole("button", { name: "Atualizar pauta" })
    await expect(atualizar).toBeDisabled()
    await revisao.check()
    await copiar.click()
    await expect(page.getByText("Pauta copiada. Nenhuma mensagem foi enviada.", { exact: true })).toBeVisible()
    // A área de transferência do Windows normaliza quebras para CRLF.
    expect((await page.evaluate(() => navigator.clipboard.readText())).replaceAll("\r\n", "\n")).toBe(await texto.inputValue())
    const a11y = await new AxeBuilder({ page }).include('[role="dialog"]').withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()
    expect(a11y.violations).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(posts).toEqual([])
    await dialog.getByRole("button", { name: "Fechar", exact: true }).click()
    await page.getByLabel("Buscar indicador").fill(ATHLETE_NAME)
    const card = page.getByRole("article").filter({ hasText: ATHLETE_NAME })
    await card.getByRole("button", { name: "Ignorar com justificativa" }).click()
    await page.getByLabel("Justificativa (obrigatória)").fill("E2E Contexto revisto durante a reunião")
    await page.getByRole("button", { name: "Confirmar", exact: true }).click()
    await expect(card.getByText("Ignorada", { exact: true })).toBeVisible()
    await page.getByRole("button", { name: "Preparar pauta por turma" }).click()
    await expect(texto).toHaveValue(/E2E Próximo encontro combinado/)
    await expect(dialog.getByRole("alert")).toContainText("Os dados do painel mudaram")
    await expect(copiar).toBeDisabled()
    await dialog.getByRole("checkbox", { name: "Permitir substituir minhas edições ao preparar outra pauta." }).check()
    await atualizar.click()
    await expect(texto).not.toHaveValue(/E2E Próximo encontro combinado/)
    await expect(revisao).not.toBeChecked()
    await expect(dialog.getByRole("alert")).toHaveCount(0)
  })

  test("preserva versões das pautas, recupera após recarregar e recusa base antiga", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/desenvolvimento")
    const dialog = page.getByRole("dialog", { name: "Pauta semanal por turma" })
    const abrir = async () => {
      await page.getByRole("button", { name: "Preparar pauta por turma" }).click()
      await dialog.getByLabel("Turma da pauta").selectOption("E2E Sub-13")
      await dialog.getByRole("button", { name: "Preparar pauta", exact: true }).click()
    }
    await abrir()
    const texto = dialog.getByLabel("Pauta para revisão")
    const revisao = dialog.getByRole("checkbox", { name: "Revisei a pauta para uso interno da comissão." })
    const primeira = "E2E Pauta primeira versão revisada e preservada pela comissão."
    const segunda = "E2E Pauta segunda versão revisada, com outro encaminhamento para a equipe."
    const salvar = async (conteudo: string) => {
      await texto.fill(conteudo)
      await expect(dialog.getByRole("button", { name: "Salvar pauta revisada" })).toBeDisabled()
      await revisao.check()
      await dialog.getByRole("button", { name: "Salvar pauta revisada" }).click()
      await expect(dialog.getByRole("button", { name: "Versão salva", exact: true })).toBeDisabled()
    }
    await salvar(primeira)
    await page.reload()
    await abrir()
    await salvar(primeira)
    expect(await db.pautaSemanal.count({ where: { turma: "E2E Sub-13", usuario: "admin_e2e" } })).toBe(1)
    await salvar(segunda)
    expect(await db.pautaSemanal.count({ where: { turma: "E2E Sub-13", usuario: "admin_e2e" } })).toBe(2)
    await page.reload()
    await page.getByRole("button", { name: "Preparar pauta por turma" }).click()
    await dialog.getByRole("button", { name: "Consultar pautas salvas" }).click()
    const historico = dialog.getByRole("region", { name: "Histórico de pautas revisadas" })
    const rows = historico.getByRole("listitem").filter({ hasText: "E2E Sub-13" })
    await expect(rows).toHaveCount(2)
    await rows.nth(0).getByRole("button", { name: "Ver texto salvo" }).click()
    await expect(rows.nth(0).getByText(segunda, { exact: true })).toBeVisible()
    await rows.nth(0).getByRole("button", { name: "Copiar versão salva" }).click()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(segunda)
    await rows.nth(1).getByRole("button", { name: "Ver texto salvo" }).click()
    await expect(rows.nth(1).getByText(primeira, { exact: true })).toBeVisible()
    await expect(rows.nth(1)).toContainText("admin_e2e")
    const comparacao = dialog.getByRole("region", { name: "Comparar pautas salvas" })
    const versoes = await db.pautaSemanal.findMany({ where: { turma: "E2E Sub-13", usuario: "admin_e2e" }, orderBy: { id: "asc" } })
    await expect(comparacao.getByRole("button", { name: "Comparar versões" })).toBeDisabled()
    await comparacao.getByLabel("Primeira versão").selectOption(String(versoes[1].id))
    await comparacao.getByLabel("Segunda versão").selectOption(String(versoes[1].id))
    await expect(comparacao.getByRole("button", { name: "Comparar versões" })).toBeDisabled()
    await comparacao.getByLabel("Segunda versão").selectOption(String(versoes[0].id))
    await comparacao.getByRole("button", { name: "Comparar versões" }).click()
    await expect(comparacao.getByText("− Removido da versão anterior", { exact: true })).toBeVisible()
    await expect(comparacao.getByText(primeira, { exact: true })).toBeVisible()
    await expect(comparacao.getByText("+ Incluído na versão posterior", { exact: true })).toBeVisible()
    await expect(comparacao.getByText(segunda, { exact: true })).toBeVisible()
    const a11y = await new AxeBuilder({ page }).include('[role="dialog"]').withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()
    expect(a11y.violations).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)

    await dialog.getByLabel("Turma da pauta").selectOption("E2E Sub-13")
    await dialog.getByRole("button", { name: "Preparar pauta", exact: true }).click()
    const aluno = await db.aluno.findFirstOrThrow({ where: { nome: ATHLETE_NAME }, select: { id: true } })
    const insightKey = `${aluno.id}:avaliacao_atrasada:${inicioDaSemana(new Date())}`
    await db.acaoDesenvolvimento.upsert({ where: { insightKey },
      create: { alunoId: aluno.id, insightKey, tipo: "avaliacao_atrasada", titulo: "Avaliação de desenvolvimento pendente", acao: "Agendar avaliação", status: "pendente" },
      update: { status: "pendente" },
    })
    const nova = "E2E Pauta terceira versão que usa dados desatualizados e não deve ser salva."
    await texto.fill(nova)
    await revisao.check()
    await comparacao.getByRole("button", { name: "Comparar versões" }).click()
    await expect(comparacao.getByText(segunda, { exact: true })).toBeVisible()
    await expect(texto).toHaveValue(nova)
    await expect(revisao).toBeChecked()
    await dialog.getByRole("button", { name: "Salvar pauta revisada" }).click()
    await expect(dialog.getByRole("alert")).toContainText("registros da turma mudaram")
    await expect(texto).toHaveValue(nova)
    expect(await db.pautaSemanal.count({ where: { turma: "E2E Sub-13", usuario: "admin_e2e" } })).toBe(2)
  })

  test("filtra pautas antigas por turma e ciclo, pagina e preserva o rascunho", async ({ page }) => {
    const turmaAntiga = "E2E Pautas Arquivadas"
    const cicloAtual = inicioDaSemana(new Date())
    const cicloAnterior = inicioDaSemana(new Date(Date.now() - 7 * 86400000))
    await db.pautaSemanal.createMany({ data: [
      ...Array.from({ length: 12 }, (_, index) => ({ turma: turmaAntiga, cicloInicio: index === 11 ? cicloAtual : cicloAnterior, texto: `E2E Versão arquivada ${index} para consulta dos filtros de histórico.`, usuario: "admin_e2e", chave: `e2e-pauta-filtros:${index}` })),
      { turma: "", cicloInicio: cicloAnterior, texto: "E2E Pauta sem turma para verificar distinção do filtro geral.", usuario: "admin_e2e", chave: "e2e-pauta-filtros:sem-turma" },
    ] })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/desenvolvimento")
    await page.getByRole("button", { name: "Preparar pauta por turma" }).click()
    const dialog = page.getByRole("dialog", { name: "Pauta semanal por turma" })
    await dialog.getByLabel("Turma da pauta").selectOption("E2E Sub-13")
    await dialog.getByRole("button", { name: "Preparar pauta", exact: true }).click()
    const texto = dialog.getByLabel("Pauta para revisão")
    const rascunho = "E2E Rascunho revisado que deve permanecer intacto ao consultar outras turmas."
    await texto.fill(rascunho)
    const revisao = dialog.getByRole("checkbox", { name: "Revisei a pauta para uso interno da comissão." })
    await revisao.check()
    await dialog.getByRole("button", { name: "Consultar pautas salvas" }).click()
    const historico = dialog.getByRole("region", { name: "Histórico de pautas revisadas" })
    const filtroTurma = historico.getByLabel("Turma no histórico")
    const filtroCiclo = historico.getByLabel("Ciclo no histórico")
    await filtroTurma.selectOption({ label: turmaAntiga })
    await filtroCiclo.fill(cicloAnterior)
    await expect(historico.getByRole("listitem")).toHaveCount(0)
    await historico.getByRole("button", { name: "Aplicar filtros" }).click()
    await expect(historico.getByRole("listitem")).toHaveCount(10)
    await historico.getByRole("button", { name: "Carregar pautas anteriores" }).click()
    await expect(historico.getByRole("listitem")).toHaveCount(11)
    await expect(historico.getByRole("button", { name: "Carregar pautas anteriores" })).toHaveCount(0)
    for (const row of await historico.getByRole("listitem").all()) {
      await expect(row).toContainText(turmaAntiga)
      await expect(row).toContainText(cicloAnterior.split("-").reverse().join("/"))
    }
    const comparacao = historico.getByRole("region", { name: "Comparar pautas salvas" })
    await expect(comparacao.getByLabel("Primeira versão").locator("option")).toHaveCount(12)
    const anteriorId = await db.pautaSemanal.findUniqueOrThrow({ where: { chave: "e2e-pauta-filtros:0" }, select: { id: true } })
    await comparacao.getByLabel("Primeira versão").selectOption(String(anteriorId.id))
    await filtroCiclo.fill(cicloAtual)
    await expect(comparacao).toHaveCount(0)
    await historico.getByRole("button", { name: "Aplicar filtros" }).click()
    await expect(historico.getByRole("listitem")).toHaveCount(1)
    await expect(comparacao.getByLabel("Primeira versão")).toHaveValue("")

    // Salvar uma pauta de outra turma não deve inseri-la no resultado filtrado.
    await dialog.getByRole("button", { name: "Salvar pauta revisada" }).click()
    await expect(dialog.getByRole("button", { name: "Versão salva", exact: true })).toBeDisabled()
    await expect(historico.getByRole("listitem")).toHaveCount(1)
    await expect(historico.getByRole("listitem").first()).toContainText(turmaAntiga)
    await expect(texto).toHaveValue(rascunho)
    await expect(revisao).toBeChecked()

    await filtroTurma.selectOption({ label: "Sem turma" })
    await filtroCiclo.fill(cicloAnterior)
    await historico.getByRole("button", { name: "Aplicar filtros" }).click()
    await expect(historico.getByRole("listitem").filter({ hasText: "Sem turma" })).not.toHaveCount(0)
    await expect(historico.getByRole("listitem").filter({ hasText: turmaAntiga })).toHaveCount(0)
    await filtroCiclo.fill("1900-01-01")
    await historico.getByRole("button", { name: "Aplicar filtros" }).click()
    await expect(historico.getByText("Nenhuma pauta encontrada para estes filtros.")).toBeVisible()
    await historico.getByRole("button", { name: "Limpar filtros do histórico" }).click()
    await expect(filtroTurma).toHaveValue("")
    await expect(filtroCiclo).toHaveValue("")
    await expect(historico.getByRole("listitem")).toHaveCount(10)
    await expect(texto).toHaveValue(rascunho)
    const a11y = await new AxeBuilder({ page }).include('[role="dialog"]').withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()
    expect(a11y.violations).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })

  test("avisa antes de recarregar uma pauta editada e mantém o texto ao cancelar", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/desenvolvimento")
    await page.getByRole("button", { name: "Preparar pauta por turma" }).click()
    const dialog = page.getByRole("dialog", { name: "Pauta semanal por turma" })
    await dialog.getByLabel("Turma da pauta").selectOption("E2E Sub-13")
    await dialog.getByRole("button", { name: "Preparar pauta", exact: true }).click()
    const texto = dialog.getByLabel("Pauta para revisão")
    const avisoEdicoes = dialog.getByText(/^Alterações não salvas\./)
    await expect(avisoEdicoes).toHaveCount(0)
    const editado = "E2E Pauta editada que precisa sobreviver ao cancelamento da recarga."
    await texto.fill(editado)
    await expect(avisoEdicoes).toBeVisible()
    await dialog.getByRole("checkbox", { name: "Revisei a pauta para uso interno da comissão." }).check()
    await dialog.getByRole("button", { name: "Copiar pauta revisada" }).click()
    await expect(avisoEdicoes).toBeVisible()
    await dialog.getByRole("button", { name: "Fechar", exact: true }).click()
    await expect(page.getByText(/^Há alterações não salvas na pauta\./)).toBeVisible()
    const quantidade = await db.pautaSemanal.count({ where: { turma: "E2E Sub-13", usuario: "admin_e2e" } })
    const aviso = page.waitForEvent("dialog")
    // Não aguardamos um evento de load que não ocorrerá se a recarga for cancelada.
    await page.evaluate(() => { setTimeout(() => window.location.reload(), 0) })
    const confirmacao = await aviso
    expect(confirmacao.type()).toBe("beforeunload")
    await confirmacao.dismiss()
    await expect(page.getByText(/^Há alterações não salvas na pauta\./)).toBeVisible()
    await page.getByRole("button", { name: "Preparar pauta por turma" }).click()
    await expect(texto).toHaveValue(editado)
    await expect(dialog.getByRole("checkbox", { name: "Revisei a pauta para uso interno da comissão." })).toBeChecked()
    expect(await db.pautaSemanal.count({ where: { turma: "E2E Sub-13", usuario: "admin_e2e" } })).toBe(quantidade)
    const a11y = await new AxeBuilder({ page }).include('[role="dialog"]').withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()
    expect(a11y.violations).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await dialog.getByRole("button", { name: "Salvar pauta revisada" }).click()
    await expect(dialog.getByRole("button", { name: "Versão salva", exact: true })).toBeDisabled()
    await expect(avisoEdicoes).toHaveCount(0)
    await texto.fill(`${editado} Outra edição.`)
    await expect(avisoEdicoes).toBeVisible()
    await texto.fill(editado)
    await expect(avisoEdicoes).toHaveCount(0)
    // Sem listener pendente, não há diálogo nativo impedindo a recarga.
    await page.reload()
    expect(await db.pautaSemanal.count({ where: { turma: "E2E Sub-13", usuario: "admin_e2e" } })).toBe(quantidade + 1)
    await expect(page.getByText(/^Há alterações não salvas na pauta\./)).toHaveCount(0)
  })

  test("não expõe o painel para visitantes sem sessão", async ({ page }) => {
    await page.context().clearCookies()
    await page.goto("/desenvolvimento")
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole("region", { name: "Equidade de oportunidades" })).toHaveCount(0)
    await expect(page.getByRole("region", { name: "Pauta semanal da comissão" })).toHaveCount(0)
  })
})
