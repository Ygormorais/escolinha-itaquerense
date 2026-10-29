import { describe, expect, it } from "vitest"
import { resolveStaffDestination, staffDefaultDestination } from "@/lib/auth-destination"

describe("página inicial por perfil", () => {
  it("admin cai no Início, secretaria em Pagamentos, técnico em Desenvolvimento", () => {
    expect(staffDefaultDestination("admin")).toBe("/dashboard")
    expect(staffDefaultDestination("secretaria")).toBe("/pagamentos")
    expect(staffDefaultDestination("tecnico")).toBe("/desenvolvimento")
  })

  it("respeita o destino pedido quando o perfil tem acesso", () => {
    expect(resolveStaffDestination("/alunos", "secretaria")).toBe("/alunos")
  })

  it("volta para a página inicial do perfil quando não tem acesso", () => {
    expect(resolveStaffDestination("/caixa", "secretaria")).toBe("/pagamentos")
  })
})
