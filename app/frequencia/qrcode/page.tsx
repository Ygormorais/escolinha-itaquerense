import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { TURMAS } from "@/lib/constants"
import { QrCodeClient } from "./qrcode-client"

export const metadata = { title: "QR Code de Presença — Escolinha Itaquerense" }

export default async function QrCodePage() {
  await requireAuth()
  const comAlunos = await db.aluno.findMany({
    where: { status: "Ativo" },
    select: { turma: true },
    distinct: ["turma"],
  })
  const turmasAtivas = TURMAS.filter((t) => comAlunos.some((a) => a.turma === t))

  return <QrCodeClient turmas={turmasAtivas} />
}
