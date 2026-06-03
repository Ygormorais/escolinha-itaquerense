import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export async function requireAuth(allowedRoles?: string[]): Promise<{ user: string; role: string }> {
  const session = await getSession()
  if (!session.authenticated || !session.user) {
    throw new Error("Não autenticado. Faça login primeiro.")
  }
  if (allowedRoles && !allowedRoles.includes(session.role ?? "")) {
    throw new Error("Acesso não autorizado para esta função.")
  }
  return { user: session.user, role: session.role ?? "admin" }
}

export function redirectIfNotAuthenticated(allowedRoles?: string[]) {
  return async () => {
    const session = await getSession()
    if (!session.authenticated) {
      redirect("/login")
    }
    if (allowedRoles && session.role && !allowedRoles.includes(session.role)) {
      redirect("/")
    }
  }
}

export function authError() {
  return { error: "Não autenticado. Faça login primeiro." }
}

export type Role = "admin" | "secretaria" | "tecnico"

export const ROLES: { value: Role; label: string }[] = [
  { value: "admin", label: "Administrador" },
  { value: "secretaria", label: "Secretaria" },
  { value: "tecnico", label: "Técnico" },
]

export function can(role: string | undefined, ...allowed: Role[]): boolean {
  if (!role) return false
  if (role === "admin") return true
  return allowed.includes(role as Role)
}

export function roleLabel(role: string): string {
  return ROLES.find((r) => r.value === role)?.label ?? role
}
