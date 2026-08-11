import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyCheckinToken } from "@/lib/checkin-token"
import { checkRateLimit } from "@/lib/rate-limit"
import { rateLimitResponse } from "@/lib/rate-limit-response"

function redirectToCheckin(req: NextRequest, token: string, result: "ok" | "ja" | "erro") {
  const url = new URL("/checkin", req.url)
  url.searchParams.set("token", token)
  url.searchParams.set(result === "erro" ? "erro" : "ok", result === "erro" ? "credenciais" : "1")
  if (result === "ja") url.searchParams.set("ja", "1")
  return NextResponse.redirect(url, 303)
}

// POST /api/checkin — o QR identifica turma/data; matrícula + nascimento identificam o aluno.
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  const globalLimit = checkRateLimit(`checkin:${ip}`, 60, 10 * 60_000)
  if (!globalLimit.ok) return rateLimitResponse(globalLimit.retryAfterMs)

  const form = await req.formData()
  const token = String(form.get("token") ?? "")
  const matricula = String(form.get("matricula") ?? "").trim()
  const dataNascimento = String(form.get("dataNascimento") ?? "").trim()
  const claims = verifyCheckinToken(token)

  if (!claims) {
    return NextResponse.json({ error: "Link de check-in inválido ou expirado" }, { status: 400 })
  }

  const alunoId = Number(matricula)
  if (!Number.isInteger(alunoId) || alunoId <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(dataNascimento)) {
    return redirectToCheckin(req, token, "erro")
  }

  const identityLimit = checkRateLimit(`checkin:${ip}:${alunoId}`, 5, 10 * 60_000)
  if (!identityLimit.ok) return rateLimitResponse(identityLimit.retryAfterMs)

  const aluno = await db.aluno.findFirst({
    where: { id: alunoId, turma: claims.turma, status: "Ativo" },
    select: { id: true, dataNascimento: true },
  })
  if (!aluno || aluno.dataNascimento.toISOString().slice(0, 10) !== dataNascimento) {
    return redirectToCheckin(req, token, "erro")
  }

  const data = new Date(`${claims.data}T12:00:00.000Z`)
  const existente = await db.frequencia.findUnique({
    where: { alunoId_data: { alunoId, data } },
    select: { id: true },
  })
  await db.frequencia.upsert({
    where: { alunoId_data: { alunoId, data } },
    create: { alunoId, data, presenca: "Presente" },
    update: { presenca: "Presente" },
  })

  return redirectToCheckin(req, token, existente ? "ja" : "ok")
}
