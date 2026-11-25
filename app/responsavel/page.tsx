import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { ResponsavelDashboardClient } from "./dashboard-client"
import { buscarProximosEventos } from "@/lib/responsavel-eventos"
import { buscarJogosPortal } from "@/lib/responsavel-jogos"
import { getConfig } from "@/lib/config"
import { acoesDoPortal } from "@/lib/portal-acoes"
import { podeResponder } from "@/lib/satisfacao"
import { hojeNoClube } from "@/lib/portal-mensalidades"
import { restanteDoPagamento } from "@/lib/valor-devido"

export const metadata = { title: "Portal do Responsável — Escolinha Itaquerense" }

export default async function ResponsavelPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated || session.responsavelId == null) redirect("/responsavel/login")

  const [responsavel, config] = await Promise.all([
    db.responsavel.findUnique({
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
              orderBy: { dataVencimento: "desc" },
              take: 6,
              select: {
                mesReferencia: true,
                dataVencimento: true,
                dataPagamento: true,
                valorRecebido: true,
                formaPagamento: true,
              },
            },
            frequencias: {
              orderBy: { data: "desc" },
              take: 10,
              select: { data: true, presenca: true },
            },
            uniformes: { select: { item: true, entregue: true } },
          },
        },
      },
    }),
    Promise.resolve(getConfig()),
  ])

  if (!responsavel) redirect("/responsavel/login")

  const alunoIds = responsavel.alunos.map((a) => a.id)
  const turmasAlunos = responsavel.alunos.map((a) => a.turma)

  const [comunicados, proximosEventos, jogos, abertas, documentos, pesquisas] = await Promise.all([
    alunoIds.length > 0
      ? db.whatsAppMensagem.findMany({
          where: {
            alunoId: { in: alunoIds },
            origem: "comunicado",
            direcao: "outgoing",
          },
          orderBy: { createdAt: "desc" },
          take: 8,
          select: { mensagem: true, createdAt: true },
        })
      : Promise.resolve([]),
    buscarProximosEventos(session.responsavelId, turmasAlunos),
    buscarJogosPortal(turmasAlunos),
    // Mensalidades sem quitação (parciais incluídas): base do "Precisa de você".
    alunoIds.length > 0
      ? db.pagamento.findMany({
          where: { alunoId: { in: alunoIds }, dataPagamento: null },
          select: { alunoId: true, dataVencimento: true, valorDevido: true, valorRecebido: true, aluno: { select: { mensalidade: true, desconto: true } } },
        })
      : Promise.resolve([]),
    // Documentos obrigatórios (versão vigente) sem aceite desta família.
    alunoIds.length > 0
      ? db.documentoInstitucional.findMany({
          where: { ativo: true },
          select: {
            versoes: {
              orderBy: [{ publicadoEm: "desc" }, { id: "desc" }],
              take: 1,
              select: { turmas: true, obrigatorio: true, aceites: { where: { responsavelId: session.responsavelId }, select: { alunoId: true } } },
            },
          },
        })
      : Promise.resolve([]),
    // Pesquisa de satisfação em andamento (a elegibilidade é decidida abaixo, pela regra única).
    alunoIds.length > 0
      ? db.pesquisaSatisfacao.findMany({
          where: { encerradaEm: null },
          orderBy: { inicio: "desc" },
          take: 3,
          select: { titulo: true, inicio: true, fim: true, encerradaEm: true, respostas: { where: { responsavelId: session.responsavelId }, select: { id: true } } },
        })
      : Promise.resolve([]),
  ])

  const hoje = hojeNoClube(new Date())
  const atrasadas = abertas.filter((p) => p.dataVencimento.toISOString().slice(0, 10) < hoje)
  const aVencer = abertas.filter((p) => !atrasadas.includes(p))
  const somaRestante = (lista: typeof abertas) => Math.round(lista.reduce((s, p) => s + restanteDoPagamento(p), 0) * 100) / 100
  const documentosPendentes = documentos.reduce((total, doc) => {
    const versao = doc.versoes[0]
    if (!versao?.obrigatorio) return total
    const turmas = versao.turmas.split(",").map((t) => t.trim())
    const sem = responsavel.alunos.filter(
      (a) => (turmas.includes("Todas") || turmas.includes(a.turma)) && !versao.aceites.some((x) => x.alunoId === a.id),
    )
    return total + sem.length
  }, 0)
  const pesquisaPendente = pesquisas.find((p) => podeResponder({ campanha: p, hoje, alunosAtivos: alunoIds.length, jaRespondeu: p.respostas.length > 0 })) ?? null
  const acoes = acoesDoPortal({
    atrasadas: atrasadas.length,
    aVencer: aVencer.length,
    restanteAtrasado: somaRestante(atrasadas),
    restanteAVencer: somaRestante(aVencer),
    documentosPendentes,
    pesquisaPendente,
  })

  return (
    <ResponsavelDashboardClient
      responsavel={{
        ...responsavel,
        // Situação de cada aluno a partir de TODAS as mensalidades abertas (o histórico traz só as 6 últimas).
        alunos: responsavel.alunos.map((a) => {
          const doAluno = abertas.filter((p) => p.alunoId === a.id)
          const situacaoAberta = doAluno.some((p) => atrasadas.includes(p)) ? "atrasada" : doAluno.length > 0 ? "a-vencer" : "nenhuma"
          return { ...a, situacaoAberta }
        }),
      }}
      comunicados={comunicados}
      proximosEventos={proximosEventos}
      jogos={jogos}
      acoes={acoes}
      whatsapp={config.whatsapp}
    />
  )
}
