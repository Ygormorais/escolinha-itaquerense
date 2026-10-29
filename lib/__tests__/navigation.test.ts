import { describe, expect, it } from "vitest"
import { bottomNavItems, isNavItemActive, NAV_SECTIONS, navSectionsFor, secaoAtiva } from "@/lib/navigation"
import { canAccessStaffPath } from "@/lib/permissions"

const todosOsItens = NAV_SECTIONS.flatMap((s) => [{ href: s.href, label: s.label, icon: s.icon }, ...s.children])

describe("navSectionsFor", () => {
  it("admin vê as 10 seções na ordem do desenho", () => {
    expect(navSectionsFor("admin").map((s) => s.label)).toEqual([
      "Início", "Pagamentos", "Alunos", "Frequência", "Jogos e agenda",
      "Desenvolvimento", "Comunicação", "Loja", "Financeiro", "Configurações",
    ])
  })

  it("secretaria em Financeiro cai no primeiro sub-item permitido", () => {
    const fin = navSectionsFor("secretaria").find((s) => s.label === "Financeiro")!
    expect(fin.href).toBe("/recibos")
    expect(fin.children.map((c) => c.href)).not.toContain("/caixa")
    expect(fin.children.map((c) => c.href)).not.toContain("/recibos")
  })

  it("seção sem nenhuma rota permitida some", () => {
    expect(navSectionsFor("tecnico").map((s) => s.label)).not.toContain("Financeiro")
  })

  it("nunca mostra rota que o papel não acessa", () => {
    for (const role of ["admin", "secretaria", "tecnico"] as const) {
      for (const s of navSectionsFor(role)) {
        expect(canAccessStaffPath(s.href, role)).toBe(true)
        for (const c of s.children) expect(canAccessStaffPath(c.href, role)).toBe(true)
      }
    }
  })

  it("badge de atraso só em Pagamentos", () => {
    const secoes = navSectionsFor("admin", { atraso: 8 })
    expect(secoes.find((s) => s.label === "Pagamentos")!.badge).toBe(8)
    expect(secoes.filter((s) => s.badge).map((s) => s.label)).toEqual(["Pagamentos"])
  })

  it("sub-itens com contagem própria recebem o badge", () => {
    const alunos = navSectionsFor("admin", { solicitacoes: 2, matriculas: 3 }).find((s) => s.label === "Alunos")!
    expect(alunos.children.find((c) => c.href === "/configuracoes/solicitacoes")?.badge).toBe(2)
    expect(alunos.children.find((c) => c.href === "/configuracoes/matriculas")?.badge).toBe(3)
  })

  it("Pendências e Secretaria não estão no menu", () => {
    const hrefs = navSectionsFor("admin").flatMap((s) => [s.href, ...s.children.map((c) => c.href)])
    expect(hrefs).not.toContain("/pendencias")
    expect(hrefs).not.toContain("/secretaria")
  })
})

describe("secaoAtiva", () => {
  it("rota de sub-item ativa a seção", () => {
    expect(secaoAtiva("/turmas", navSectionsFor("admin"))?.label).toBe("Alunos")
    expect(secaoAtiva("/relatorio/turmas", navSectionsFor("admin"))?.label).toBe("Financeiro")
    expect(secaoAtiva("/alunos/12", navSectionsFor("admin"))?.label).toBe("Alunos")
    expect(secaoAtiva("/relatorio/frequencia", navSectionsFor("tecnico"))?.label).toBe("Frequência")
  })
})

describe("bottomNavItems", () => {
  it("4 atalhos por perfil", () => {
    expect(bottomNavItems("admin").map((i) => i.href)).toEqual(["/dashboard", "/pagamentos", "/alunos", "/frequencia"])
    expect(bottomNavItems("secretaria").map((i) => i.href)).toEqual(["/pagamentos", "/alunos", "/frequencia", "/comunicados"])
    expect(bottomNavItems("tecnico").map((i) => i.href)).toEqual(["/desenvolvimento", "/frequencia", "/agenda", "/alunos"])
  })

  it("nunca mostra rota que o papel não acessa", () => {
    for (const role of ["admin", "secretaria", "tecnico"] as const) {
      for (const item of bottomNavItems(role)) expect(canAccessStaffPath(item.href, role)).toBe(true)
    }
  })

  it("usa o mesmo rótulo da seção do menu", () => {
    expect(bottomNavItems("admin")[0].label).toBe("Início")
  })
})

describe("isNavItemActive", () => {
  it("respeita limite de segmento", () => {
    expect(isNavItemActive("/alunos/12", "/alunos", todosOsItens)).toBe(true)
    expect(isNavItemActive("/alunosx", "/alunos", todosOsItens)).toBe(false)
  })

  it("prefere o item mais específico", () => {
    expect(isNavItemActive("/configuracoes/midia", "/configuracoes/midia", todosOsItens)).toBe(true)
  })
})
