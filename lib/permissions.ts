export type StaffRole = "admin" | "secretaria" | "tecnico"

const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  admin: "Administrador",
  secretaria: "Secretaria",
  tecnico: "Técnico",
}

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
    "/relatorio",
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

export function staffRoleLabel(role: StaffRole): string {
  return STAFF_ROLE_LABELS[role]
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

/** Matriz única usada pelo proxy e pelas navegações desktop/mobile. */
export function canAccessStaffPath(pathname: string, role: StaffRole): boolean {
  if (role === "admin") return true
  // O relatório de frequência é a única visão de relatórios necessária ao técnico.
  if (role === "tecnico" && matchesPrefix(pathname, "/relatorio/frequencia")) return true
  return !RESTRICTED_PREFIXES[role].some((prefix) => matchesPrefix(pathname, prefix))
}
