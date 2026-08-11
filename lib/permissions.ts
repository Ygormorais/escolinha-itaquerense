export type StaffRole = "admin" | "secretaria" | "tecnico"

const RESTRICTED_PREFIXES: Record<Exclude<StaffRole, "admin">, readonly string[]> = {
  tecnico: [
    "/pagamentos",
    "/uniformes",
    "/custos",
    "/comunicados",
    "/inadimplencia",
    "/caixa",
    "/produtos",
    "/recibos",
    "/relatorio/alunos",
    "/relatorio/pagamentos",
    "/historico",
    "/configuracoes/midia",
    "/configuracoes",
    "/configuracoes/responsaveis",
    "/secretaria",
  ],
  secretaria: [
    "/custos",
    "/caixa",
    "/produtos",
    "/campeonatos",
    "/avaliacoes",
    "/tecnico",
  ],
}

export function isStaffRole(value: string | undefined): value is StaffRole {
  return value === "admin" || value === "secretaria" || value === "tecnico"
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

/** Matriz única usada pelo proxy e pelas navegações desktop/mobile. */
export function canAccessStaffPath(pathname: string, role: StaffRole): boolean {
  if (role === "admin") return true
  return !RESTRICTED_PREFIXES[role].some((prefix) => matchesPrefix(pathname, prefix))
}
