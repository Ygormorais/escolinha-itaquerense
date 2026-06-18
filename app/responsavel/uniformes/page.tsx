import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ShoppingBag } from "lucide-react"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export const metadata = { title: "Uniformes — Escolinha Itaquerense" }

export default async function UniformesPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated) redirect("/responsavel/login")

  const responsavel = await db.responsavel.findUnique({
    where: { id: session.responsavelId },
    include: {
      alunos: {
        where: { status: "Ativo" },
        include: {
          uniformes: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  })

  if (!responsavel) redirect("/responsavel/login")

  const alunos = responsavel.alunos
  const totalEntregues = alunos.flatMap((a) => a.uniformes).filter((u) => u.entregue).length
  const totalItens = alunos.flatMap((a) => a.uniformes).length

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <section className="overflow-hidden rounded-3xl border border-black/5 bg-[linear-gradient(135deg,_rgba(127,0,0,0.96)_0%,_rgba(183,28,28,0.92)_55%,_rgba(229,57,53,0.82)_100%)] px-6 py-7 text-white shadow-lg sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-4">
            <Link href="/responsavel" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white/90 transition-colors hover:bg-white/16">
              <ArrowLeft className="size-4" />
              Voltar ao portal
            </Link>
            <div className="space-y-2">
              <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">Uniformes</h1>
              <p className="max-w-2xl text-sm leading-7 text-white/78 sm:text-[15px]">
                Acompanhe os itens de uniforme dos seus filhos e solicite novos quando necessário.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-xl border border-white/14 bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Total de itens</p>
              <p className="mt-2 text-2xl font-bold">{totalItens}</p>
            </div>
            <div className="rounded-xl border border-white/14 bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Entregues</p>
              <p className="mt-2 text-2xl font-bold">{totalEntregues}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Conteúdo */}
      {alunos.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum aluno vinculado a esta conta.
          </CardContent>
        </Card>
      )}

      {alunos.map((aluno) => (
        <Card key={aluno.id}>
          <CardHeader className="flex flex-row items-center justify-between border-b border-black/5 pb-4">
            <div>
              <CardTitle className="text-lg">{aluno.nome}</CardTitle>
              <p className="text-sm text-muted-foreground">{aluno.turma}</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/responsavel/solicitacoes">
                <ShoppingBag className="size-4" />
                Solicitar item
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {aluno.uniformes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum item registrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <th className="pb-2 pr-4">Item</th>
                      <th className="pb-2 pr-4">Tamanho</th>
                      <th className="pb-2 pr-4">Status</th>
                      <th className="pb-2">Entrega</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {aluno.uniformes.map((u) => (
                      <tr key={u.id}>
                        <td className="py-2.5 pr-4 font-medium">{u.item}</td>
                        <td className="py-2.5 pr-4 text-muted-foreground">{u.tamanho ?? "—"}</td>
                        <td className="py-2.5 pr-4">
                          {u.entregue
                            ? <Badge className="bg-success-100 text-success-700 border-success-200">Entregue</Badge>
                            : <Badge variant="outline" className="text-amber-600 border-amber-300">Pendente</Badge>
                          }
                        </td>
                        <td className="py-2.5 text-muted-foreground">
                          {u.dataEntrega ? format(new Date(u.dataEntrega), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
