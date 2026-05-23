import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { MensalidadesClient } from "./mensalidades-client"

export default async function MensalidadesPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated) redirect("/responsavel/login")

  const responsavel = await db.responsavel.findUnique({
    where: { id: session.responsavelId },
    include: {
      alunos: {
        where: { status: "Ativo" },
        include: {
          pagamentos: { orderBy: { dataVencimento: "desc" } },
        },
      },
    },
  })

  if (!responsavel) redirect("/responsavel/login")

  return <MensalidadesClient responsavel={responsavel as any} />
}
