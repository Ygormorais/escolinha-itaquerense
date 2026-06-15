import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CreditCard, CalendarCheck, Shirt } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { formatMoney } from "@/lib/utils"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const aluno = await db.aluno.findUnique({ where: { id: Number(id) }, select: { nome: true } })
  return { title: aluno ? `${aluno.nome} — Portal do Responsável` : "Perfil — Portal do Responsável" }
}

export default async function PerfilAlunoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getResponsavelSession()
  if (!session.authenticated) redirect("/responsavel/login")

  const aluno = await db.aluno.findUnique({
    where: { id: Number(id) },
    include: {
      pagamentos: { orderBy: { dataVencimento: "desc" }, take: 12 },
      frequencias: { orderBy: { data: "desc" }, take: 20 },
      uniformes: true,
    },
  })

  if (!aluno || aluno.responsavelId !== session.responsavelId) redirect("/responsavel")

  const mesAtual = format(new Date(), "yyyy-MM")
  const pagMesAtual = aluno.pagamentos.find((p) => p.mesReferencia === mesAtual)
  const freqRecente = aluno.frequencias.slice(0, 10)
  const taxaPresenca =
    freqRecente.length > 0
      ? Math.round(
          (freqRecente.filter((f) => f.presenca === "Presente").length / freqRecente.length) * 100
        )
      : null

  function badgeTaxa(perc: number | null) {
    if (perc === null) return <Badge variant="secondary">Sem dados</Badge>
    if (perc >= 75) return <Badge className="bg-success-50 text-success-600">{perc}%</Badge>
    if (perc >= 50) return <Badge className="bg-warning-50 text-warning-600">{perc}%</Badge>
    return <Badge className="bg-danger-50 text-danger-600">{perc}%</Badge>
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <section className="overflow-hidden rounded-3xl border border-black/5 bg-[linear-gradient(135deg,_rgba(127,0,0,0.96)_0%,_rgba(183,28,28,0.92)_55%,_rgba(229,57,53,0.82)_100%)] px-6 py-7 text-white shadow-lg sm:px-8">
        <div className="space-y-4">
          <Link
            href="/responsavel"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white/90 transition-colors hover:bg-white/16"
          >
            <ArrowLeft className="size-4" />
            Voltar ao portal
          </Link>

          <div className="flex items-center gap-5">
            {aluno.foto ? (
              <div className="relative size-20 shrink-0 overflow-hidden rounded-full border-2 border-white/30 shadow-lg">
                <Image
                  src={aluno.foto}
                  alt={aluno.nome}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex size-20 shrink-0 items-center justify-center rounded-full border-2 border-white/30 bg-white/15 text-2xl font-extrabold">
                {aluno.nome[0]}
              </div>
            )}

            <div className="min-w-0">
              <h1 className="font-heading text-3xl font-extrabold tracking-tight">{aluno.nome}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/80">
                <Badge className="border-white/20 bg-white/15 text-white">{aluno.turma}</Badge>
                {aluno.horario && <span>{aluno.horario}</span>}
                {aluno.dataNascimento && (
                  <span>Nasc. {format(new Date(aluno.dataNascimento), "dd/MM/yyyy")}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Situação Financeira */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="size-4" /> Situação Financeira
          </CardTitle>
          {pagMesAtual?.dataPagamento ? (
            <Badge className="bg-success-50 text-success-600">Em dia</Badge>
          ) : (
            <Badge variant="destructive">Pendente</Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {aluno.pagamentos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum histórico de pagamento.</p>
          ) : (
            <div className="space-y-2">
              {aluno.pagamentos.slice(0, 6).map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-black/5 bg-[var(--color-paper-50)] px-3 py-2 text-sm"
                >
                  <span className="font-medium text-[var(--color-ink-900)]">{p.mesReferencia}</span>
                  <span className={p.dataPagamento ? "font-semibold text-success-600" : "text-[var(--color-ink-500)]"}>
                    {p.dataPagamento ? formatMoney(p.valorRecebido ?? aluno.mensalidade) : "Pendente"}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Link
            href={`/responsavel/mensalidades?alunoId=${aluno.id}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-900"
          >
            Ver todas as mensalidades →
          </Link>
        </CardContent>
      </Card>

      {/* Frequência Recente */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarCheck className="size-4" /> Frequência Recente
          </CardTitle>
          {badgeTaxa(taxaPresenca)}
        </CardHeader>
        <CardContent className="p-0">
          {freqRecente.length === 0 ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">Nenhum registro de frequência ainda.</p>
          ) : (
            <div className="divide-y divide-border">
              {freqRecente.map((f, i) => (
                <div key={f.id} className="flex items-center justify-between px-6 py-3">
                  <span className="text-sm font-medium">
                    {format(new Date(f.data), "EEE, dd/MM", { locale: ptBR })}
                  </span>
                  <Badge
                    className={
                      f.presenca === "Presente"
                        ? "bg-success-50 text-success-600"
                        : f.presenca === "Justificado"
                        ? "bg-warning-50 text-warning-600"
                        : "bg-danger-50 text-danger-600"
                    }
                  >
                    {f.presenca}
                  </Badge>
                </div>
              ))}
            </div>
          )}
          <div className="p-4">
            <Link
              href="/responsavel/frequencia"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-900"
            >
              Ver histórico completo →
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Uniformes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shirt className="size-4" /> Uniformes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {aluno.uniformes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum item de uniforme registrado.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {aluno.uniformes.map((u, i) => (
                <div
                  key={u.id}
                  className={`rounded-xl border p-3 text-sm ${
                    u.entregue
                      ? "border-success-200 bg-success-50"
                      : "border-black/5 bg-[var(--color-paper-50)]"
                  }`}
                >
                  <p className="font-semibold text-[var(--color-ink-900)]">{u.item}</p>
                  {u.tamanho && <p className="text-xs text-muted-foreground">Tam. {u.tamanho}</p>}
                  <p
                    className={`mt-1 text-xs font-semibold ${
                      u.entregue ? "text-success-600" : "text-[var(--color-ink-500)]"
                    }`}
                  >
                    {u.entregue ? "✓ Entregue" : "Pendente"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
