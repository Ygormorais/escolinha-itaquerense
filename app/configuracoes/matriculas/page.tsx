/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 · macrostructure: Narrative Workflow · tone: acolhedor e operacional · anchor hue: vermelho alvirrubro */
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
    <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-8 bg-[var(--color-paper-50)]/40 p-4 sm:p-6 lg:p-8 dark:bg-transparent">
      <PageHeader title="Matrículas" description="Pré-matrículas e renovações recebidas." />

      <div className="space-y-10" data-slot="matriculas-workflow">
        <section aria-labelledby="pre-matriculas-title" className="border-t-2 border-brand-800 pt-4">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Etapa 1</p>
              <h2 id="pre-matriculas-title" className="font-heading text-xl font-semibold">Pré-Matrículas</h2>
            </div>
          </div>
          <MatriculasClient matriculas={parsed} />
        </section>
        <section aria-labelledby="renovacoes-title" className="border-t-2 border-brand-800 pt-4">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Etapa 2</p>
              <h2 id="renovacoes-title" className="flex items-center gap-2 font-heading text-xl font-semibold">Renovações
            {pendentes > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                {pendentes}
              </span>
            )}
          </h2>
            </div>
          </div>
          <RenovacoesAdminClient renovacoes={renovacoes} />
        </section>
      </div>
    </div>
  )
}
