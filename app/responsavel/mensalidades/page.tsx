import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { MensalidadesClient } from "./mensalidades-client"

export const metadata = { title: "Mensalidades — Escolinha Itaquerense" }

export default async function MensalidadesPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated || session.responsavelId == null) redirect("/responsavel/login")

  const anoAtual = new Date().getFullYear()
  // Ano atual + dezembro anterior (mensalidades de virada) — evita payload histórico
  const mesInicio = `${anoAtual - 1}-12`

  const responsavel = await db.responsavel.findUnique({
    where: { id: session.responsavelId },
    select: {
      nome: true,
      alunos: {
        where: { status: "Ativo" },
        select: {
          id: true,
          nome: true,
          turma: true,
          mensalidade: true,
          desconto: true,
          pagamentos: {
            where: { mesReferencia: { gte: mesInicio } },
            orderBy: { dataVencimento: "desc" },
            select: {
              mesReferencia: true,
              dataVencimento: true,
              dataPagamento: true,
              valorRecebido: true,
              formaPagamento: true,
            },
          },
        },
      },
    },
  })

  if (!responsavel) redirect("/responsavel/login")

  return <MensalidadesClient responsavel={responsavel} />
}
