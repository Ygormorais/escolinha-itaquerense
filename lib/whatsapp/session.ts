import { db } from "@/lib/db"

const SESSION_TTL_HOURS = 24

export async function getSession(telefone: string) {
  const session = await db.chatSession.findUnique({ where: { telefone } })
  if (!session) return null
  if (session.expiresAt < new Date()) {
    await db.chatSession.delete({ where: { telefone } })
    return null
  }
  return session
}

export async function createSession(telefone: string) {
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + SESSION_TTL_HOURS)
  return db.chatSession.upsert({
    where: { telefone },
    create: { telefone, expiresAt },
    update: { expiresAt, identificado: false, bloqueado: false, historico: "[]" },
  })
}

export async function identifySession(telefone: string, responsavelId: number) {
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + SESSION_TTL_HOURS)
  return db.chatSession.update({
    where: { telefone },
    data: { responsavelId, identificado: true, expiresAt },
  })
}

export async function appendHistory(
  telefone: string,
  role: "user" | "assistant",
  content: string
) {
  const session = await db.chatSession.findUnique({ where: { telefone } })
  if (!session) return
  let history: { role: string; content: string }[] = []
  try {
    history = JSON.parse(session.historico)
  } catch {
    history = []
  }
  history.push({ role, content })
  const trimmed = history.slice(-10) // keep last 10 messages
  await db.chatSession.update({
    where: { telefone },
    data: { historico: JSON.stringify(trimmed) },
  })
}

export async function blockSession(telefone: string) {
  return db.chatSession.update({
    where: { telefone },
    data: { bloqueado: true },
  })
}

export async function unblockSession(telefone: string) {
  return db.chatSession.update({
    where: { telefone },
    data: { bloqueado: false },
  })
}
