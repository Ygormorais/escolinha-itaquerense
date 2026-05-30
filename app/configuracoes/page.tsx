import { getClubConfig } from "@/app/actions/config"
import { PageHeader } from "@/components/layout/page-header"
import { ConfigForm } from "./config-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GerarAnoButton } from "@/components/ui/gerar-ano-button"
import { CalendarRange, Mail } from "lucide-react"
import { EmailNotifButton } from "@/components/ui/email-notif-button"

export default async function ConfiguracoesPage() {
  const config = await getClubConfig()
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Configurações"
        description="Dados do clube exibidos nos recibos"
      />
      <ConfigForm config={config} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarRange className="size-4 text-brand-800" />
            Geração anual de mensalidades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Gera os 12 meses do ano selecionado para todos os alunos ativos.
            Meses já existentes são ignorados.
          </p>
          <GerarAnoButton />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-4 text-brand-800" />
            Notificações por E-mail
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Envia e-mails automáticos para os responsáveis com mensalidades vencidas e lembretes de vencimento.
          </p>
          <EmailNotifButton />
        </CardContent>
      </Card>
    </div>
  )
}
