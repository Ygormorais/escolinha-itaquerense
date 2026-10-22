import { describe, expect, it } from "vitest"
import { bottomNavItems, isNavItemActive, navGroupsFor, NAV_GROUPS } from "@/lib/navigation"
import { canAccessStaffPath } from "@/lib/permissions"

const todosOsItens = NAV_GROUPS.flatMap((g) => g.items)

describe("bottomNavItems", () => {
  it("admin vê os 4 atalhos prioritários, com pendências logo após o dashboard", () => {
    expect(bottomNavItems("admin").map((i) => i.href)).toEqual(["/dashboard", "/pendencias", "/alunos", "/pagamentos"])
  })

  it("técnico recebe 4 atalhos do próprio trabalho em vez de ficar com 2", () => {
    const hrefs = bottomNavItems("tecnico").map((i) => i.href)
    expect(hrefs).toHaveLength(4)
    expect(hrefs).toEqual(["/tecnico", "/frequencia", "/campeonatos", "/alunos"])
  })

  it("secretaria recebe 4 atalhos", () => {
    expect(bottomNavItems("secretaria").map((i) => i.href)).toEqual(["/dashboard", "/pendencias", "/alunos", "/pagamentos"])
  })

  it("nunca mostra rota que o papel não acessa", () => {
    for (const role of ["admin", "secretaria", "tecnico"] as const) {
      for (const item of bottomNavItems(role)) expect(canAccessStaffPath(item.href, role)).toBe(true)
    }
  })

  it("usa o mesmo rótulo e ícone da Sidebar", () => {
    for (const role of ["admin", "secretaria", "tecnico"] as const) {
      for (const item of bottomNavItems(role)) {
        const daSidebar = todosOsItens.find((i) => i.href === item.href)
        expect(daSidebar).toBeDefined()
        expect(item.label).toBe(daSidebar!.label)
        expect(item.icon).toBe(daSidebar!.icon)
      }
    }
  })
})

describe("navGroupsFor", () => {
  it("filtra itens por papel e preenche badges pela chave", () => {
    const grupos = navGroupsFor("tecnico", { pendencias: 3 })
    const itens = grupos.flatMap((g) => g.items)
    expect(itens.some((i) => i.href === "/pagamentos")).toBe(false)
    expect(itens.find((i) => i.href === "/pendencias")?.badge).toBe(3)
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
