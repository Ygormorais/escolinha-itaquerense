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
            Envia e-mails automáticos para os responsáveis com mensalidades vencidas.
            Configure as variáveis abaixo no arquivo <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">.env</code>:
          </p>
          <div className="rounded-lg bg-muted p-4 font-mono text-xs leading-relaxed">
            <p>SMTP_HOST=smtp.gmail.com</p>
            <p>SMTP_PORT=587</p>
            <p>SMTP_USER=seuemail@gmail.com</p>
            <p>SMTP_PASS=sua_senha_de_app</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Para Gmail, use uma <strong>senha de app</strong> gerada em Conta Google → Segurança → Verificação em duas etapas → Senhas de app.
          </p>
          <EmailNotifButton />

          <div className="mt-4 border-t pt-4">
            <p className="text-sm font-semibold mb-2">Agendamento automático (cron)</p>
            <p className="text-xs text-muted-foreground mb-2">
              Para envio automático diário, chame este endpoint (ex.: Windows Task Scheduler ou cron do Linux):
            </p>
            <div className="rounded-lg bg-muted p-3 font-mono text-xs">
              curl http://localhost:3000/api/cron/lembretes
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Adicione <code className="rounded bg-muted px-1 py-0.5 font-mono">CRON_SECRET=sua_senha</code> no .env e envie{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono">Authorization: Bearer sua_senha</code> no header para proteger o endpoint.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
