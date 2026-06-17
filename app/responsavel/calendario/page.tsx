import { redirect } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { eventoAplicaATurma, montarAgenda, type ItemAgenda } from "@/lib/agenda"
import { ConvocacaoCard } from "@/components/responsavel/convocacao-card"

export const metadata = { title: "Calendário — Portal do Responsável" }

const ICONE: Record<ItemAgenda["tipo"], string> = {
  treino: "⚽",
  jogo: "🏆",
  evento: "📣",
  reuniao: "📣",
}

function resolverMes(mes: string | undefined): { ano: number; mesNum: number } {
  if (mes && /^\d{4}-\d{2}$/.test(mes)) {
    const [ano, mesNum] = mes.split("-").map(Number)
    if (mesNum >= 1 && mesNum <= 12) return { ano, mesNum }
  }
  const hoje = new Date()
  return { ano: hoje.getFullYear(), mesNum: hoje.getMonth() + 1 }
}

const mesStr = (ano: number, mesNum: number) => `${ano}-${String(mesNum).padStart(2, "0")}`

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ aluno?: string; mes?: string }>
}) {
  const { aluno: alunoParam, mes: mesParam } = await searchParams
  const session = await getResponsavelSession()
  if (!session.authenticated || session.responsavelId == null) redirect("/responsavel/login")

  const responsavel = await db.responsavel.findUnique({
    where: { id: session.responsavelId },
    select: {
      alunos: {
        where: { status: "Ativo" },
        select: { id: true, nome: true, turma: true },
        orderBy: { nome: "asc" },
      },
    },
  })
  const alunos = responsavel?.alunos ?? []
  const { ano, mesNum } = resolverMes(mesParam)
  const tituloMes = format(new Date(ano, mesNum - 1, 1), "MMMM 'de' yyyy", { locale: ptBR })

  const Hero = (
    <section className="overflow-hidden rounded-3xl border border-black/5 bg-[linear-gradient(135deg,_rgba(127,0,0,0.96)_0%,_rgba(183,28,28,0.92)_55%,_rgba(229,57,53,0.82)_100%)] px-6 py-7 text-white shadow-lg sm:px-8">
      <div className="space-y-4">
        <Link href="/responsavel" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white/90 transition-colors hover:bg-white/16">
          <ArrowLeft className="size-4" />
          Voltar ao portal
        </Link>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight">Calendário</h1>
      </div>
    </section>
  )

  if (alunos.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {Hero}
        <p className="text-muted-foreground">Nenhum aluno ativo vinculado.</p>
      </div>
    )
  }

  const alunoSel = alunos.find((a) => String(a.id) === alunoParam) ?? alunos[0]

  const inicio = new Date(ano, mesNum - 1, 1)
  const fim = new Date(ano, mesNum, 0, 23, 59, 59)

  const [eventos, jogos] = await Promise.all([
    db.evento.findMany({ where: { data: { gte: inicio, lte: fim } }, orderBy: { data: "asc" } }),
    db.escalacaoJogador.findMany({
      where: { alunoId: alunoSel.id, convocadoEm: { not: null }, partida: { data: { gte: inicio, lte: fim } } },
      select: { id: true, confirmacao: true, partida: { select: { data: true, adversario: true, local: true } } },
    }),
  ])

  const eventosTurma = eventos
    .filter((e) => e.turmas != null && eventoAplicaATurma(e.turmas, alunoSel.turma))
    .map((e) => ({ tipo: e.tipo, data: e.data, horaInicio: e.horaInicio, titulo: e.titulo, local: e.local, descricao: e.descricao }))
  const jogosInput = jogos.map((j) => ({ escalacaoId: j.id, confirmacao: j.confirmacao, partida: j.partida }))

  const dias = montarAgenda(eventosTurma, jogosInput)

  const prev = mesStr(mesNum === 1 ? ano - 1 : ano, mesNum === 1 ? 12 : mesNum - 1)
  const next = mesStr(mesNum === 12 ? ano + 1 : ano, mesNum === 12 ? 1 : mesNum + 1)
  const q = (mes: string, alunoId: number) => `?aluno=${alunoId}&mes=${mes}`

  return (
    <div className="flex flex-col gap-6">
      {Hero}

      {alunos.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          {alunos.map((a) => (
            <Link
              key={a.id}
              href={q(mesStr(ano, mesNum), a.id)}
              className={
                a.id === alunoSel.id
                  ? "rounded-full bg-brand-800 px-4 py-1.5 text-sm font-semibold text-white"
                  : "rounded-full bg-[var(--color-paper-100)] px-4 py-1.5 text-sm font-semibold text-[var(--color-ink-700)] hover:bg-brand-50"
              }
            >
              {a.nome.split(" ")[0]}
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <Link href={q(prev, alunoSel.id)} className="inline-flex size-9 items-center justify-center rounded-full border border-black/10 hover:bg-brand-50" aria-label="Mês anterior">
          <ChevronLeft className="size-4" />
        </Link>
        <span className="text-base font-semibold capitalize">{tituloMes}</span>
        <Link href={q(next, alunoSel.id)} className="inline-flex size-9 items-center justify-center rounded-full border border-black/10 hover:bg-brand-50" aria-label="Próximo mês">
          <ChevronRight className="size-4" />
        </Link>
      </div>

      {dias.length === 0 ? (
        <p className="rounded-xl border border-black/5 bg-[var(--color-paper-50)] px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhum compromisso em {tituloMes}.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {dias.map((dia) => (
            <div key={dia.data.toISOString()} className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-700">
                {format(dia.data, "EEE, dd 'de' MMM", { locale: ptBR })}
              </h2>
              {dia.itens.map((item, i) =>
                item.jogo ? (
                  <ConvocacaoCard
                    key={`j-${item.jogo.escalacaoId}`}
                    convocacao={{
                      escalacaoId: item.jogo.escalacaoId,
                      alunoNome: alunoSel.nome,
                      adversario: item.jogo.adversario,
                      data: item.data.toISOString(),
                      local: item.local ?? "",
                      confirmacao: item.jogo.confirmacao,
                    }}
                  />
                ) : (
                  <div key={`e-${i}`} className="flex items-start gap-3 rounded-xl border border-black/5 bg-card px-4 py-3">
                    <span className="text-xl leading-none">{ICONE[item.tipo]}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--color-ink-900)]">
                        {item.hora ? `${item.hora} · ` : ""}{item.titulo}
                      </p>
                      {item.local && <p className="text-sm text-muted-foreground">{item.local}</p>}
                      {item.descricao && <p className="mt-1 text-sm text-muted-foreground">{item.descricao}</p>}
                    </div>
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
