import Link from "next/link"
import { UserX } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { AlunoEmRisco } from "@/lib/dashboard-metrics"

export function RiscoEvasaoCard({ alunos: riscoEvasao }: { alunos: AlunoEmRisco[] }) {
  return (
    <Card className="border-danger-600/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-danger-600">
          <UserX className="size-4" />
          Alunos em Risco de Evasão ({riscoEvasao.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {riscoEvasao.map((a) => (
            <Link key={a.id} href={`/alunos/${a.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors">
              <div>
                <p className="text-sm font-medium">{a.nome}</p>
                <p className="text-xs text-muted-foreground">{a.turma}</p>
              </div>
              <div className="flex items-center gap-2">
                {a.pctFreq !== null && (
                  <Badge className={`text-[10px] ${a.pctFreq < 40 ? "bg-danger-50 text-danger-600" : "bg-warning-50 text-warning-600"}`}>
                    {a.pctFreq}% presença
                  </Badge>
                )}
                {a.pctFreq === null && (
                  <Badge className="text-[10px] bg-muted text-muted-foreground">sem chamada</Badge>
                )}
                <Badge className="text-[10px] bg-danger-50 text-danger-600">
                  {a.mesesAtraso} {a.mesesAtraso === 1 ? "mês" : "meses"} atraso
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
