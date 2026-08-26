import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import DashboardLoading from "@/app/dashboard/loading"

describe("DashboardLoading", () => {
  it("anuncia o carregamento sem expor o skeleton à árvore de acessibilidade", () => {
    const html = renderToStaticMarkup(<DashboardLoading />)

    expect(html).toContain('role="status"')
    expect(html).toContain('aria-busy="true"')
    expect(html).toContain("Carregando visão geral do dashboard")
    expect(html).toContain('aria-hidden="true"')
  })

  it("representa os principais blocos para reduzir mudanças de layout", () => {
    const html = renderToStaticMarkup(<DashboardLoading />)

    expect(html.match(/rounded-2xl border/g)?.length).toBeGreaterThanOrEqual(6)
    expect(html.match(/h-64 w-full/g)?.length).toBe(2)
    expect(html).toContain("h-72 w-full")
  })
})
