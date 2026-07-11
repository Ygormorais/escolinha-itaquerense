import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Trophy } from "lucide-react"
import { nomeTime } from "@/lib/landing/times"
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

  const statusClass = (status: string) => {
    if (status === "aberto") return "border-success-600/20 bg-success-50 text-success-600"
    if (status === "andamento") return "border-brand-200 bg-brand-50 text-brand-800"
    if (status === "encerrado") return "border-border bg-muted text-muted-foreground"
    return "border-border bg-muted text-muted-foreground"
  }

  const statusLabel = (status: string) => {
    if (status === "aberto") return "Aberto"
    if (status === "andamento") return "Em Andamento"
    if (status === "encerrado") return "Encerrado"
    return status
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 border-b border-border border-l-4 border-l-brand-600 pb-4 pl-3">
        <Trophy className="h-5 w-5 text-brand-600" />
        <h2 className="font-heading text-xl font-extrabold tracking-tight text-foreground">
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
          <Card key={camp.id} className="overflow-hidden border-border/80 border-l-4 border-l-brand-600 shadow-sm">
            <CardHeader className="border-b border-black/5 bg-[var(--color-paper-50)]/50 pb-3 dark:bg-muted/20">
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="font-heading text-base font-extrabold">{camp.nome}</CardTitle>
                  <Badge variant="outline" className={`text-xs ${statusClass(camp.status)}`}>
                    {statusLabel(camp.status)}
                  </Badge>
                  <span className="inline-flex items-center gap-1 rounded border border-success-600/20 bg-success-50 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-success-600">
                    FPFS
                  </span>
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
                            (p.resultado === "Vitoria" ? "bg-success-50/50 " :
                            p.resultado === "Derrota" ? "bg-destructive/5 " : "") +
                            "hover:bg-muted/40 transition-colors"
                          }
                        >
                          <TableCell className="font-medium">
                            {nomeTime(p.adversario)}
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
                        <TableRow key={p.id} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="font-medium">{nomeTime(p.adversario)}</TableCell>
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
