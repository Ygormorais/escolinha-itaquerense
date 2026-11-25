import { PAGINA_ADMIN } from "@/components/layout/pagina"
import { PageHeader } from "@/components/layout/page-header"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { getConfig } from "@/lib/config"
import { hojeNoClube } from "@/lib/datas-clube"
import { ocupacaoPorJanela } from "@/lib/aula-experimental-dados"
import { mensagemDaAula, podeConverter, taxaDeConversao, telefoneNormalizado } from "@/lib/aula-experimental"
import { whatsappHrefPara } from "@/lib/whatsapp-modelos"
import { AulaExperimentalAdmin } from "./aula-experimental-admin"

export const metadata = { title: "Aula experimental — Escolinha Itaquerense" }
export const dynamic = "force-dynamic"

function diasAtras(dia: string, dias: number): string {
  const [a, m, d] = dia.split("-").map(Number)
  return new Date(Date.UTC(a, m - 1, d - dias)).toISOString().slice(0, 10)
}

export default async function AulaExperimentalAdminPage() {
  await requireAuth(["admin", "secretaria"])
  const config = getConfig()
  const hoje = hojeNoClube()

  const [janelas, aulas, totaisPorStatus] = await Promise.all([
    db.janelaAulaExperimental.findMany({
      where: { data: { gte: diasAtras(hoje, 14) } },
      orderBy: [{ data: "asc" }, { hora: "asc" }],
    }),
    db.aulaExperimental.findMany({
      include: { janela: true },
      orderBy: [{ createdAt: "desc" }],
      take: 300,
    }),
    db.aulaExperimental.groupBy({ by: ["status"], _count: { _all: true } }),
  ])
  const ocupacao = await ocupacaoPorJanela(janelas.map((j) => j.id))

  const total = (status: string) => totaisPorStatus.find((t) => t.status === status)?._count._all ?? 0
  const inscritas = totaisPorStatus.filter((t) => t.status !== "cancelada").reduce((soma, t) => soma + t._count._all, 0)
  const taxas = taxaDeConversao({ inscritas, compareceram: total("compareceu"), convertidas: total("convertida") })

  return (
    <div className={PAGINA_ADMIN}>
      <PageHeader
        title="Aula experimental"
        description="Datas abertas no site, inscrições das famílias e conversão em pré-matrícula."
      />
      <AulaExperimentalAdmin
        hoje={hoje}
        resumo={{
          inscritas,
          compareceram: total("compareceu"),
          convertidas: total("convertida"),
          comparecimento: taxas.comparecimento,
          conversao: taxas.conversao,
        }}
        janelas={janelas.map((j) => ({
          id: j.id,
          turma: j.turma,
          data: j.data,
          hora: j.hora,
          duracaoMin: j.duracaoMin,
          local: j.local,
          capacidade: j.capacidade,
          ativa: j.ativa,
          ocupadas: ocupacao.get(j.id) ?? 0,
        }))}
        aulas={aulas.map((a) => ({
          id: a.id,
          nomeAtleta: a.nomeAtleta,
          dataNascimento: a.dataNascimento.toISOString().slice(0, 10),
          nomeResponsavel: a.nomeResponsavel,
          telefone: a.telefone,
          email: a.email,
          status: a.status,
          turma: a.janela.turma,
          data: a.janela.data,
          hora: a.janela.hora,
          lembreteEnviado: a.lembreteEnviadoEm != null,
          podeConverter: podeConverter(a),
          whatsappHref: telefoneNormalizado(a.telefone)
            ? whatsappHrefPara(a.telefone, mensagemDaAula(a, a.janela, config.nome, config.modelosMensagem))
            : null,
        }))}
      />
    </div>
  )
}
