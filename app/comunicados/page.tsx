import { Metadata } from "next"
import { ComunicadoMassa } from "@/components/whatsapp/comunicado-massa"
import { PageHeader } from "@/components/layout/page-header"

export const metadata: Metadata = {
  title: "Comunicados — Escolinha Itaquerense",
}

export default function ComunicadosPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Comunicados"
        description="Envie avisos em massa para turmas via WhatsApp"
      />
      <ComunicadoMassa />
    </div>
  )
}
