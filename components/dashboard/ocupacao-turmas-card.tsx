import { Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function OcupacaoTurmasCard({
  ocupacaoTurmas,
  capacidadeTurma,
}: {
  ocupacaoTurmas: { turma: string; count: number }[]
  capacidadeTurma: number
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="size-4 text-brand-800" />
          Ocupação das Turmas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {ocupacaoTurmas.map(({ turma, count }) => {
            const pct = capacidadeTurma > 0
              ? Math.min(100, Math.round((count / capacidadeTurma) * 100))
              : 0
            const barColor =
              pct >= 90 ? "bg-danger-600" :
              pct >= 70 ? "bg-warning-600" :
              "bg-success-600"
            return (
              <div key={turma} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{turma}</span>
                  <span className="text-xs text-muted-foreground">{count}/{capacidadeTurma}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{pct}% ocupado</p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
