import { PageHeader } from "@/components/layout/page-header"
import { FrequenciaClient } from "./frequencia-client"
import { ResumoFrequenciaClient } from "./resumo-client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function FrequenciaPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Frequência"
        description="Registre e acompanhe a presença dos alunos"
      />
      <Tabs defaultValue="registro">
        <TabsList>
          <TabsTrigger value="registro">Registro</TabsTrigger>
          <TabsTrigger value="resumo">Resumo Mensal</TabsTrigger>
        </TabsList>
        <TabsContent value="registro" className="mt-4">
          <FrequenciaClient />
        </TabsContent>
        <TabsContent value="resumo" className="mt-4">
          <ResumoFrequenciaClient />
        </TabsContent>
      </Tabs>
    </div>
  )
}
