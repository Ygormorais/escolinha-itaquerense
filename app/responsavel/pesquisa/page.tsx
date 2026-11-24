import { redirect } from "next/navigation"
import { ClipboardCheck } from "lucide-react"
import { PAGINA_PORTAL } from "@/components/layout/pagina"
import { PortalHero } from "@/components/responsavel/portal-hero"
import { EmptyState } from "@/components/ui/empty-state"
import { db } from "@/lib/db"
import { hojeNoClube } from "@/lib/datas-clube"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { campanhaAberta } from "@/lib/satisfacao"
import { PesquisaForm } from "./pesquisa-form"

export const metadata = { title: "Pesquisa de satisfação — Portal da Família" }

export default async function PesquisaFamiliaPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated || session.responsavelId == null) redirect("/responsavel/login")

  const [pesquisas, alunosAtivos] = await Promise.all([
    db.pesquisaSatisfacao.findMany({
      where: { encerradaEm: null },
      orderBy: { inicio: "desc" },
      take: 3,
      select: {
        id: true,
        titulo: true,
        pergunta: true,
        inicio: true,
        fim: true,
        encerradaEm: true,
        respostas: { where: { responsavelId: session.responsavelId }, select: { id: true } },
      },
    }),
    db.aluno.count({ where: { responsavelId: session.responsavelId, status: "Ativo" } }),
  ])
  const aberta = pesquisas.find((p) => campanhaAberta(p, hojeNoClube()))

  return (
    <div className={PAGINA_PORTAL}>
      <PortalHero backHref="/responsavel" title="Pesquisa de satisfação" description="Sua opinião ajuda a escolinha a melhorar para todas as famílias." />
      {!aberta || alunosAtivos === 0 ? (
        <EmptyState icon={ClipboardCheck} title="Nenhuma pesquisa aberta" description="Quando a escolinha abrir uma nova pesquisa, ela aparece em Precisa de você, no Início." />
      ) : aberta.respostas.length > 0 ? (
        <EmptyState icon={ClipboardCheck} title="Resposta recebida. Obrigado!" description="Sua opinião já está com a coordenação. Se quiser falar com a gente, use Conversas ou Solicitações." />
      ) : (
        <PesquisaForm pesquisaId={aberta.id} titulo={aberta.titulo} pergunta={aberta.pergunta} />
      )}
    </div>
  )
}
