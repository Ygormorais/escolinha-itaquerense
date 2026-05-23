import { getSession } from "@/lib/session"

export async function requireAuth(): Promise<string> {
  const session = await getSession()
  if (!session.authenticated) {
    throw new Error("Não autenticado. Faça login primeiro.")
  }
  return session.user!
}

export function authError() {
  return { error: "Não autenticado. Faça login primeiro." }
}
