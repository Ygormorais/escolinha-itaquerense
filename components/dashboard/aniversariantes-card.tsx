import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Cake } from "lucide-react"
import type { Aniversariante } from "@/lib/aniversariantes"

export function AniversariantesCard({ aniversariantes }: { aniversariantes: Aniversariante[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Cake className="size-5 text-brand-600" />
          Aniversariantes do mês
        </CardTitle>
      </CardHeader>
      <CardContent>
        {aniversariantes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum aniversariante este mês.</p>
        ) : (
          <ul className="space-y-2">
            {aniversariantes.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-10 font-heading font-bold text-muted-foreground tabular-nums">
                    {String(a.dia).padStart(2, "0")}
                  </span>
                  <span className="font-medium">{a.nome}</span>
                  {a.ehHoje && <Badge className="bg-brand-600 text-white">hoje 🎂</Badge>}
                </span>
                <span className="text-muted-foreground">{a.idadeQueCompleta} anos</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
