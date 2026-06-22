import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { MatriculasClient } from "./matriculas-client"
import { RenovacoesAdminClient } from "./renovacoes-client"
import { PageHeader } from "@/components/layout/page-header"

export const metadata = { title: "Matrículas — Escolinha Itaquerense" }

export default async function MatriculasPage() {
  await requireAuth(["admin", "secretaria"])

  const [matriculas, renovacoes] = await Promise.all([
    db.preMatricula.findMany({ orderBy: { createdAt: "desc" } }),
    db.renovacaoMatricula.findMany({
      include: {
        aluno: { select: { id: true, nome: true, turma: true, horario: true } },
        responsavel: { select: { nome: true, email: true, telefone: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  const parsed = matriculas.map((m) => ({
    ...m,
    documentos: m.documentos ? (JSON.parse(m.documentos) as string[]) : [],
  }))

  const pendentes = renovacoes.filter((r) => r.status === "pendente").length

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <PageHeader title="Matrículas" description="Pré-matrículas e renovações recebidas." />

      <div className="space-y-8">
        <div>
          <h2 className="mb-4 font-heading text-base font-semibold">Pré-Matrículas</h2>
          <MatriculasClient matriculas={parsed} />
        </div>
        <div>
          <h2 className="mb-4 flex items-center gap-2 font-heading text-base font-semibold">
            Renovações
            {pendentes > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                {pendentes}
              </span>
            )}
          </h2>
          <RenovacoesAdminClient renovacoes={renovacoes} />
        </div>
      </div>
    </div>
  )
}
