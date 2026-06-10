import { Metadata } from "next"
import { ComunicadoMassa } from "@/components/whatsapp/comunicado-massa"
import { PageHeader } from "@/components/layout/page-header"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare } from "lucide-react"

export const metadata: Metadata = {
  title: "Comunicados — Escolinha Itaquerense",
}

export default async function ComunicadosPage() {
  await requireAuth()

  const historico = await db.whatsAppMensagem.findMany({
    where: { origem: "comunicado" },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      mensagem: true,
      createdAt: true,
      status: true,
    },
  })

  // Agrupa mensagens enviadas no mesmo minuto como um "envio em lote"
  const lotes: { chave: string; data: Date; preview: string; total: number }[] = []
  for (const m of historico) {
    const chave = format(new Date(m.createdAt), "yyyy-MM-dd HH:mm")
    const existing = lotes.find((l) => l.chave === chave)
    if (existing) {
      existing.total++
    } else {
      lotes.push({ chave, data: new Date(m.createdAt), preview: m.mensagem.slice(0, 100), total: 1 })
    }
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title="Comunicados"
        description="Envie avisos em massa para turmas via WhatsApp"
      />
      <ComunicadoMassa />

      {lotes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-heading">
              <MessageSquare className="size-4" /> Histórico de Envios
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {lotes.map((lote) => (
              <div key={lote.chave} className="flex items-start justify-between gap-4 px-6 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">
                    {lote.preview}{lote.preview.length >= 100 ? "…" : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {format(lote.data, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-600">
                  {lote.total} enviado{lote.total > 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
