import { PageHeader } from "@/components/layout/page-header"
import { FrequenciaClient } from "./frequencia-client"

export default function FrequenciaPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Frequência"
        description="Registre a presença dos alunos por turma e data"
      />
      <FrequenciaClient />
    </div>
  )
}
