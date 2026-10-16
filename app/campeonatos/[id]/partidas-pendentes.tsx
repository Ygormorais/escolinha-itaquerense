"use client"

import Link from "next/link"
import { Swords, Shirt } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import type { PartidaCampeonato } from "@/components/campeonatos/types"

export type ListaPartidasProps = {
  partidas: PartidaCampeonato[]
  campeonatoId: number
  convocacoesMap: Set<number>
  onPlacar: (p: PartidaCampeonato) => void
  onEditar: (p: PartidaCampeonato) => void
}

export function PartidasPendentes({ partidas: pendentes, campeonatoId, convocacoesMap, onPlacar: openScore, onEditar: handleEdit }: ListaPartidasProps) {
  return (
      <Card className="border-warning-200 bg-warning-50/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-warning-600 flex items-center gap-2">
            <Swords className="size-4" aria-hidden="true" /> Pendentes ({pendentes.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-warning-200 xl:hidden">
            {pendentes.map((p) => (
              <article key={p.id} className="space-y-4 p-4">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium break-words">{p.adversario}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{format(new Date(p.data), "dd/MM/yyyy")}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">{p.local}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/campeonatos/${campeonatoId}/partidas/${p.id}/escalacao`}>
                    <Button size="sm" variant="outline" className={convocacoesMap.has(p.id) ? "border-success-600 text-success-600" : ""}>
                      <Shirt className="size-3.5" aria-hidden="true" /> Convocação
                    </Button>
                  </Link>
                  <Button size="sm" variant="outline" onClick={() => openScore(p)}>Placar</Button>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(p)}>Editar</Button>
                </div>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto xl:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Adversário</TableHead>
                <TableHead>Local</TableHead>
                <TableHead className="w-32">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendentes.map((p) => (
                <TableRow key={p.id} className="hover:bg-muted/30">
                  <TableCell>{format(new Date(p.data), "dd/MM/yyyy")}</TableCell>
                  <TableCell className="font-medium">{p.adversario}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-[10px]">{p.local}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Link href={`/campeonatos/${campeonatoId}/partidas/${p.id}/escalacao`}>
                        <Button size="sm" variant="outline" className={convocacoesMap.has(p.id) ? "border-success-600 text-success-600" : ""}>
                          <Shirt className="size-3.5" aria-hidden="true" />
                          Convocação
                          {convocacoesMap.has(p.id) && <span className="ml-1 size-2 rounded-full bg-success-600" />}
                        </Button>
                      </Link>
                      <Button size="sm" variant="outline" onClick={() => openScore(p)}>
                        Placar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(p)}>
                        Editar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
  )
}
