import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { montarMesesDoAluno } from "@/lib/portal-mensalidades"
import { MensalidadesClient } from "./mensalidades-client"

export const metadata = { title: "Mensalidades — Escolinha Itaquerense" }

export default async function MensalidadesPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated || session.responsavelId == null) redirect("/responsavel/login")

  const agora = new Date()
  const ano = agora.getFullYear()

  const responsavel = await db.responsavel.findUnique({
    where: { id: session.responsavelId },
    select: {
      nome: true,
      alunos: {
        where: { status: "Ativo" },
        orderBy: { nome: "asc" },
        select: {
          id: true,
          nome: true,
          turma: true,
          mensalidade: true,
          desconto: true,
          pagamentos: {
            // Ano atual + qualquer mensalidade antiga ainda em aberto — evita payload histórico
            where: { OR: [{ mesReferencia: { gte: `${ano}-01` } }, { dataPagamento: null }] },
            select: {
              mesReferencia: true,
              dataVencimento: true,
              dataPagamento: true,
              valorRecebido: true,
              valorDevido: true,
              formaPagamento: true,
              recibos: {
                where: { canceladoAt: null },
                select: { id: true, numero: true, valor: true, dataPagamento: true },
              },
            },
          },
        },
      },
    },
  })

  if (!responsavel) redirect("/responsavel/login")

  const alunos = responsavel.alunos.map((a) => ({
    id: a.id,
    nome: a.nome,
    turma: a.turma,
    mensalidade: a.mensalidade,
    desconto: a.desconto,
    meses: montarMesesDoAluno(a, a.pagamentos, ano, agora),
  }))

  return <MensalidadesClient responsavelNome={responsavel.nome} ano={ano} alunos={alunos} />
}
