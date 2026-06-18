import { PageHeader } from "@/components/layout/page-header"
import { FrequenciaClient } from "./frequencia-client"
import { ResumoFrequenciaClient } from "./resumo-client"
import { EstatisticasFrequencia } from "./estatisticas-client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { db } from "@/lib/db"
import { TURMAS } from "@/lib/constants"

export const metadata = { title: "Frequência — Escolinha Itaquerense" }

export default async function FrequenciaPage() {
  // Abre numa turma que tenha alunos (evita cair em Sub-7 vazia), na ordem de TURMAS.
  const comAlunos = await db.aluno.findMany({
    where: { status: "Ativo" },
    select: { turma: true },
    distinct: ["turma"],
  })
  const presentes = new Set(comAlunos.map((t) => t.turma))
  const turmaInicial = TURMAS.find((t) => presentes.has(t)) ?? TURMAS[0]

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Frequência"
        description="Registre e acompanhe a presença dos alunos"
      />
      <Tabs defaultValue="registro">
        <div className="overflow-x-auto">
          <TabsList className="w-max min-w-full">
            <TabsTrigger value="registro">Registro</TabsTrigger>
            <TabsTrigger value="resumo">Resumo Mensal</TabsTrigger>
            <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="registro" className="mt-4">
          <FrequenciaClient turmaInicial={turmaInicial} />
        </TabsContent>
        <TabsContent value="resumo" className="mt-4">
          <ResumoFrequenciaClient />
        </TabsContent>
        <TabsContent value="estatisticas" className="mt-4">
          <EstatisticasFrequencia />
        </TabsContent>
      </Tabs>
    </div>
  )
}
