import { redirect } from "next/navigation"
import Link from "next/link"
import { ShoppingBag, Users } from "lucide-react"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { PortalHero } from "@/components/responsavel/portal-hero"
import { EmptyState } from "@/components/ui/empty-state"

export const metadata = { title: "Uniformes — Escolinha Itaquerense" }

export default async function UniformesPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated || session.responsavelId == null) redirect("/responsavel/login")

  const responsavel = await db.responsavel.findUnique({
    where: { id: session.responsavelId },
    select: {
      alunos: {
        where: { status: "Ativo" },
        select: {
          id: true,
          nome: true,
          turma: true,
          uniformes: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              item: true,
              tamanho: true,
              entregue: true,
              dataEntrega: true,
            },
          },
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
      <PortalHero
        backHref="/responsavel"
        title="Uniformes"
        description="Acompanhe os itens de uniforme dos seus filhos e solicite novos quando necessário."
        stats={[
          { label: "Total de itens", value: totalItens },
          { label: "Entregues", value: totalEntregues },
        ]}
      />

      {alunos.length === 0 && (
        <EmptyState
          icon={Users}
          title="Nenhum aluno vinculado"
          description="Quando houver atletas associados à sua conta, os uniformes aparecem aqui."
          href="/responsavel"
          hrefLabel="Voltar ao portal"
        />
      )}

      {alunos.map((aluno) => (
        <Card key={aluno.id}>
          <CardHeader className="flex flex-row items-center justify-between border-b border-black/5 pb-4">
            <div>
              <CardTitle className="text-lg">{aluno.nome}</CardTitle>
              <p className="text-sm text-muted-foreground">{aluno.turma}</p>
            </div>
            <Link href="/responsavel/solicitacoes" className={buttonVariants({ variant: "outline", size: "sm" })}>
              <ShoppingBag className="size-4" />
              Solicitar item
            </Link>
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
                            ? <Badge className="bg-success-50 text-success-600 border-success-600/20">Entregue</Badge>
                            : <Badge variant="outline" className="text-warning-600 border-warning-600/30">Pendente</Badge>
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
