import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import DashboardLoading from "@/app/dashboard/loading"

describe("DashboardLoading", () => {
  it("anuncia o carregamento sem expor o skeleton à árvore de acessibilidade", () => {
    const html = renderToStaticMarkup(<DashboardLoading />)

    expect(html).toContain('role="status"')
    expect(html).toContain('aria-busy="true"')
    expect(html).toContain("Carregando o Início")
    expect(html).toContain('aria-hidden="true"')
  })

  it("representa os principais blocos para reduzir mudanças de layout", () => {
    const html = renderToStaticMarkup(<DashboardLoading />)

    // 4 números + "Precisa de você" + gráfico
    expect(html.match(/data-slot="esqueleto-numero"/g)?.length).toBe(4)
    expect(html.match(/data-slot="esqueleto-bloco"/g)?.length).toBe(2)
  })
})
