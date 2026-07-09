import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getClubConfig } from "@/app/actions/config"
import { PageHeader } from "@/components/layout/page-header"
import { ConfigForm } from "./config-form"
import { CronTrigger } from "./cron-trigger"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = { title: "Configurações — Escolinha Itaquerense" }

export default async function ConfiguracoesPage() {
  const config = await getClubConfig()
  return (
    <div className="flex flex-col gap-6 bg-[var(--color-paper-50)]/40 p-6 lg:p-8 dark:bg-transparent">
      <PageHeader
        title="Configurações"
        description="Dados do clube exibidos nos recibos"
      />
      <ConfigForm config={config} />

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Ferramentas</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/configuracoes/categorias">
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Virada de categoria</CardTitle>
                <CardDescription>Promova alunos para a categoria correta conforme a idade</CardDescription>
              </CardHeader>
              <CardContent>
                <ArrowRight className="size-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Automações</h2>
        <CronTrigger />
      </div>
    </div>
  )
}
