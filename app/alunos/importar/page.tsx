import { PAGINA_ADMIN } from "@/components/layout/pagina"
import { PageHeader } from "@/components/layout/page-header"
import { ImportarAlunosClient } from "./importar-client"

export const metadata = { title: "Importar alunos — Escolinha Itaquerense" }

export default function ImportarPage() {
  return (
    <div className={PAGINA_ADMIN}>
      <PageHeader
        title="Importar alunos"
        description="Faça upload de um arquivo CSV para cadastrar vários alunos de uma vez"
      />
      <ImportarAlunosClient />
    </div>
  )
}
