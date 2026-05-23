import { PageHeader } from "@/components/layout/page-header"
import { ImportarAlunosClient } from "./importar-client"

export default function ImportarPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Importar Alunos"
        description="Faça upload de um arquivo CSV para cadastrar vários alunos de uma vez"
      />
      <ImportarAlunosClient />
    </div>
  )
}
