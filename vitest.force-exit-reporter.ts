/**
 * vitest pendura no teardown (better-sqlite3 nativo + workers em fork): os testes
 * terminam, mas o processo nao sai e o `vitest run` nunca encerra no CI.
 *
 * Este reporter forca a saida assim que o run termina, com o codigo correto
 * (0 se tudo passou, 1 se houve qualquer falha). Cobre o hook novo do vitest v4
 * (onTestRunEnd) e o legado (onFinished). Roda junto do reporter padrao.
 */
export default class ForceExitReporter {
  private ctx: { state?: { getCountOfFailedTests?: () => number } } | undefined

  onInit(ctx: unknown) {
    this.ctx = ctx as ForceExitReporter["ctx"]
  }

  private finish(errors?: unknown[]) {
    let failed = 0
    try {
      failed = this.ctx?.state?.getCountOfFailedTests?.() ?? 0
    } catch {
      failed = 0
    }
    const hasErrors = Array.isArray(errors) && errors.length > 0
    const code = failed > 0 || hasErrors ? 1 : 0
    // pequeno atraso para o flush do reporter padrao antes de encerrar
    setTimeout(() => process.exit(code), 250)
  }

  // vitest v4
  onTestRunEnd(_modules?: unknown, errors?: unknown[]) {
    this.finish(errors)
  }

  // vitest v2/v3 (legado)
  onFinished(_files?: unknown, errors?: unknown[]) {
    this.finish(errors)
  }
}
