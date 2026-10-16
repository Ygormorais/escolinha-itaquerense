import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { AlertBanner, sortAlerts, type AlertItem } from "@/components/dashboard/alert-banner"

const info: AlertItem = { type: "info", icon: "tendencia", message: "Vencem em 7 dias", detail: "d", href: "/pagamentos" }
const warning: AlertItem = { type: "warning", icon: "frequencia", message: "Presença moderada", detail: "d", href: "/frequencia" }
const danger: AlertItem = { type: "danger", icon: "alerta", message: "Muitas em atraso", detail: "d", href: "/inadimplencia" }
const evasao: AlertItem = { type: "warning", icon: "alerta", message: "Risco de evasão", detail: "d", href: "/alunos" }

describe("sortAlerts", () => {
  it("ordena por severidade mantendo a ordem original entre iguais", () => {
    expect(sortAlerts([info, warning, danger, evasao]).map((a) => a.message)).toEqual([
      "Muitas em atraso",
      "Presença moderada",
      "Risco de evasão",
      "Vencem em 7 dias",
    ])
  })
})

describe("AlertBanner", () => {
  it("não renderiza nada sem alertas", () => {
    expect(renderToStaticMarkup(<AlertBanner alerts={[]} />)).toBe("")
  })

  it("mostra o alerta mais grave primeiro", () => {
    const html = renderToStaticMarkup(<AlertBanner alerts={[info, danger]} />)
    expect(html.indexOf("Muitas em atraso")).toBeLessThan(html.indexOf("Vencem em 7 dias"))
  })

  it("com até 3 alertas, a lista extra só existe no mobile", () => {
    const html = renderToStaticMarkup(<AlertBanner alerts={[info, warning, danger]} />)
    expect(html).toContain("<details")
    expect(html).toMatch(/<details[^>]*lg:hidden/)
  })

  it("com mais de 3 alertas, o desktop recolhe o excedente", () => {
    const html = renderToStaticMarkup(<AlertBanner alerts={[info, warning, danger, evasao]} />)
    expect(html).not.toMatch(/<details[^>]*lg:hidden/)
    expect(html).toContain("Ver outros 3 alertas")
    expect(html).toContain("Ver outro 1 alerta")
  })

  it("um único alerta não cria lista recolhível", () => {
    expect(renderToStaticMarkup(<AlertBanner alerts={[danger]} />)).not.toContain("<details")
  })
})
