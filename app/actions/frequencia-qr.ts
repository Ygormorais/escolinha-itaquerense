"use server"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { validarHmacQr } from "@/lib/qr"

type QrResult = { ok: true; alunoNome: string; jaRegistrado: boolean } | { ok: false; erro: string }

const recentScans = new Map<number, number>()
const RATE_LIMIT_MS = 5_000

/** Exported only for test isolation — do not use in production code */
export function _testResetScans() { recentScans.clear() }

export async function registrarPresencaQr(alunoIdStr: string, h: string, dataStr?: string): Promise<QrResult> {
  await requireAuth(["admin", "secretaria", "tecnico"])
  const alunoId = Number(alunoIdStr)
  if (!Number.isInteger(alunoId)) return { ok: false, erro: "QR inválido" }
  if (!validarHmacQr(alunoId, h)) return { ok: false, erro: "QR inválido" }
  const agora = Date.now()
  if (agora - (recentScans.get(alunoId) ?? 0) < RATE_LIMIT_MS) return { ok: false, erro: "Aguarde antes de escanear novamente" }
  recentScans.set(alunoId, agora)
  const aluno = await db.aluno.findUnique({ where: { id: alunoId }, select: { id: true, nome: true } })
  if (!aluno) return { ok: false, erro: "Aluno não encontrado" }
  const data = dataStr ? new Date(dataStr) : new Date()
  data.setHours(0, 0, 0, 0)
  const existing = await db.frequencia.findUnique({ where: { alunoId_data: { alunoId, data } } })
  await db.frequencia.upsert({
    where: { alunoId_data: { alunoId, data } },
    create: { alunoId, data, presenca: "Presente" },
    update: { presenca: "Presente" },
  })
  revalidatePath("/frequencia")
  return { ok: true, alunoNome: aluno.nome, jaRegistrado: !!existing }
}
