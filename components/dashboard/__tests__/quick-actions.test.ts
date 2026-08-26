import { describe, expect, it } from "vitest"
import { getQuickActions } from "@/components/dashboard/quick-actions"

describe("getQuickActions", () => {
  it("mantém todos os atalhos para o administrador", () => {
    expect(getQuickActions("admin").map((action) => action.href)).toEqual([
      "/alunos",
      "/pagamentos",
      "/frequencia",
      "/comunicados",
      "/caixa",
    ])
  })

  it("remove atalhos financeiros indisponíveis para a secretaria", () => {
    expect(getQuickActions("secretaria").map((action) => action.href)).toEqual([
      "/alunos",
      "/pagamentos",
      "/frequencia",
      "/comunicados",
    ])
  })

  it("mostra somente atalhos permitidos ao técnico", () => {
    expect(getQuickActions("tecnico").map((action) => action.href)).toEqual([
      "/alunos",
      "/frequencia",
    ])
  })
})
