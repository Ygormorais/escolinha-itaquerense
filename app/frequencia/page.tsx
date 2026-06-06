import { PageHeader } from "@/components/layout/page-header"
import { FrequenciaClient } from "./frequencia-client"
import { ResumoFrequenciaClient } from "./resumo-client"
import { EstatisticasFrequencia } from "./estatisticas-client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const metadata = { title: "Frequência — Escolinha Itaquerense" }

export default function FrequenciaPage() {
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
          <FrequenciaClient />
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
