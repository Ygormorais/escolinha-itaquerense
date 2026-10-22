import { Trophy } from "lucide-react"
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import type { ClassificacaoItem } from "@/lib/campeonatos"

/** Placar geral do clube no campeonato: cartões de V/E/D e linha de classificação. */
export function PartidasResumo({ stats }: { stats: ClassificacaoItem }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-12 lg:gap-4" data-slot="partidas-summary">
        <Card className="col-span-2 lg:col-span-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Jogos</CardTitle>
          </CardHeader>
          <CardContent>
            <p data-numeric className="text-2xl font-bold">{stats.jogos}</p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-success-600">Vitórias</CardTitle>
          </CardHeader>
          <CardContent>
            <p data-numeric className="text-2xl font-bold text-success-600">{stats.vitorias}</p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Empates</CardTitle>
          </CardHeader>
          <CardContent>
            <p data-numeric className="text-2xl font-bold">{stats.empates}</p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-danger-600">Derrotas</CardTitle>
          </CardHeader>
          <CardContent>
            <p data-numeric className="text-2xl font-bold text-danger-600">{stats.derrotas}</p>
          </CardContent>
        </Card>
      </div>

      {stats.jogos > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="size-4 text-brand-600" aria-hidden="true" /> Classificação
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>J</TableHead>
                  <TableHead>V</TableHead>
                  <TableHead>E</TableHead>
                  <TableHead>D</TableHead>
                  <TableHead>GP</TableHead>
                  <TableHead>GC</TableHead>
                  <TableHead>SG</TableHead>
                  <TableHead>Pts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="font-medium">
                  <TableCell>{stats.nome}</TableCell>
                  <TableCell>{stats.jogos}</TableCell>
                  <TableCell className="text-success-600">{stats.vitorias}</TableCell>
                  <TableCell>{stats.empates}</TableCell>
                  <TableCell className="text-danger-600">{stats.derrotas}</TableCell>
                  <TableCell>{stats.golsPro}</TableCell>
                  <TableCell>{stats.golsContra}</TableCell>
                  <TableCell className={stats.saldo >= 0 ? "text-success-600" : "text-danger-600"}>{stats.saldo > 0 ? "+" : ""}{stats.saldo}</TableCell>
                  <TableCell className="font-bold text-brand-700">{stats.pontos}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  )
}
