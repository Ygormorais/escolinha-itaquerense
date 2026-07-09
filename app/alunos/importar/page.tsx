import { PageHeader } from "@/components/layout/page-header"
import { ImportarAlunosClient } from "./importar-client"

export const metadata = { title: "Importar Alunos — Escolinha Itaquerense" }

export default function ImportarPage() {
  return (
    <div className="flex flex-col gap-6 bg-[var(--color-paper-50)]/40 p-6 lg:p-8 dark:bg-transparent">
      <PageHeader
        title="Importar Alunos"
        description="Faça upload de um arquivo CSV para cadastrar vários alunos de uma vez"
      />
      <ImportarAlunosClient />
    </div>
  )
}
