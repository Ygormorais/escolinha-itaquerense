import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Trophy } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { FpfsSyncButton } from "./fpfs-sync-button"

export async function FpfsJogos() {
  const campeonatos = await db.campeonato.findMany({
    where: { fpfsEventoId: { not: null } },
    include: {
      partidas: { orderBy: { data: "asc" } },
    },
    orderBy: { dataInicio: "desc" },
  })

  if (campeonatos.length === 0) return null

  const session = await getSession()
  const isAdmin = session.role === "admin"
  const agora = new Date()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 border-b border-border pb-4">
        <Trophy className="h-5 w-5 text-brand-600" />
        <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
          Jogos FPFS
        </h2>
      </div>

      {campeonatos.map((camp) => {
        const realizadas = camp.partidas
          .filter((p) => p.golsPro != null)
          .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

        const proximas = camp.partidas
          .filter((p) => p.golsPro == null && new Date(p.data) >= agora)
          .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())

        return (
          <Card key={camp.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-base">{camp.nome}</CardTitle>
                  <Badge variant="outline" className="capitalize text-xs">
                    {camp.status}
                  </Badge>
                  {camp.fpfsSyncEm && (
                    <span className="text-xs text-muted-foreground">
                      Atualizado {format(new Date(camp.fpfsSyncEm), "dd/MM 'às' HH'h'mm", { locale: ptBR })}
                    </span>
                  )}
                </div>
                {isAdmin && <FpfsSyncButton campeonatoId={camp.id} />}
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-5">
              {realizadas.length === 0 && proximas.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma partida registrada.</p>
              )}

              {realizadas.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Resultados
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Adversário</TableHead>
                        <TableHead className="text-center">Placar</TableHead>
                        <TableHead>Rodada</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {realizadas.map((p) => (
                        <TableRow
                          key={p.id}
                          className={
                            p.resultado === "Vitoria" ? "bg-success-50/50" :
                            p.resultado === "Derrota" ? "bg-destructive/5" : ""
                          }
                        >
                          <TableCell className="font-medium">
                            {p.adversario}
                          </TableCell>
                          <TableCell className="text-center font-bold">
                            {p.golsPro} × {p.golsContra}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {p.rodada != null ? `${p.rodada}ª` : "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(p.data), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            {p.sumulaUrl && (
                              <a
                                href={p.sumulaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-semibold text-brand-600 hover:underline"
                              >
                                Súmula →
                              </a>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {proximas.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Próximos Jogos
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Adversário</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Local</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {proximas.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.adversario}</TableCell>
                          <TableCell>
                            {format(new Date(p.data), "EEE dd/MM 'às' HH'h'", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {p.local ?? "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
