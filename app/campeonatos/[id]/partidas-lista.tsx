"use client"

import Link from "next/link"
import { Pencil, Trash2, Shirt, CalendarX } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import type { ListaPartidasProps } from "./partidas-pendentes"

type Props = ListaPartidasProps & { onDelete: (id: number) => Promise<void> }

function resultadoBadge(r: string | null) {
  if (!r) return <Badge variant="outline">Pendente</Badge>
  const map: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
    Vitoria: { label: "Vitória", variant: "default" },
    Empate: { label: "Empate", variant: "secondary" },
    Derrota: { label: "Derrota", variant: "outline" },
  }
  const m = map[r]
  return <Badge variant={m.variant}>{m.label}</Badge>
}

/** Lista em cartões, usada abaixo de xl. */
export function PartidasListaMobile({ partidas: filtradas, campeonatoId, convocacoesMap, onPlacar: openScore, onEditar: handleEdit, onDelete: handleDelete }: Props) {
  return (
    <div className="divide-y divide-border xl:hidden">
      {filtradas.length === 0 && (
        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
          <CalendarX className="size-8 text-muted-foreground/40" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Nenhuma partida encontrada</p>
        </div>
      )}
      {filtradas.map((p) => (
        <article key={p.id} className={cn("space-y-4 p-4", p.resultado == null && "bg-warning-50/30")}>
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium break-words">{p.adversario}</p>
              <p className="mt-1 text-sm text-muted-foreground">Rodada {p.rodada} · {format(new Date(p.data), "dd/MM")}</p>
            </div>
            {resultadoBadge(p.resultado)}
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-muted-foreground">Local</dt><dd className="mt-1">{p.local}</dd></div>
            <div><dt className="text-muted-foreground">Placar</dt><dd className="mt-1 font-semibold">{p.golsPro != null && p.golsContra != null ? `${p.golsPro} × ${p.golsContra}` : "—"}</dd></div>
          </dl>
          <div className="flex flex-wrap gap-2">
            <Link href={`/campeonatos/${campeonatoId}/partidas/${p.id}/escalacao`}>
              <Button size="sm" variant="outline" className={convocacoesMap.has(p.id) ? "border-success-600 text-success-600" : ""}>
                <Shirt className="size-3.5" aria-hidden="true" /> Convocação
              </Button>
            </Link>
            <Button size="sm" variant="outline" onClick={() => openScore(p)}>Placar</Button>
            <Button size="sm" variant="outline" onClick={() => handleEdit(p)}>Editar</Button>
            <ConfirmDialog title="Deletar partida?" description="Esta ação não pode ser desfeita." confirmLabel="Deletar" onConfirm={() => handleDelete(p.id)}>
              <Button size="icon" variant="ghost" aria-label="Deletar partida"><Trash2 className="size-4 text-danger-600" aria-hidden="true" /></Button>
            </ConfirmDialog>
          </div>
        </article>
      ))}
    </div>
  )
}

export function PartidasTabela({ partidas: filtradas, campeonatoId, convocacoesMap, onPlacar: openScore, onDelete: handleDelete }: Omit<Props, "onEditar">) {
  return (
    <div className="hidden overflow-x-auto xl:block">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">#</TableHead>
          <TableHead>Data</TableHead>
          <TableHead>Adversário</TableHead>
          <TableHead>Local</TableHead>
          <TableHead>Placar</TableHead>
          <TableHead>Resultado</TableHead>
          <TableHead className="w-20" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {filtradas.length === 0 && (
          <TableRow>
            <TableCell colSpan={7}>
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <CalendarX className="size-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Nenhuma partida encontrada</p>
              </div>
            </TableCell>
          </TableRow>
        )}
        {filtradas.map((p) => (
          <TableRow key={p.id} className={cn(p.resultado == null ? "bg-warning-50/30" : "", "hover:bg-muted/30")}>
            <TableCell className="text-muted-foreground">{p.rodada}</TableCell>
            <TableCell>{format(new Date(p.data), "dd/MM")}</TableCell>
            <TableCell className="font-medium">{p.adversario}</TableCell>
            <TableCell>
              <Badge variant="secondary" className="text-[10px]">{p.local}</Badge>
            </TableCell>
            <TableCell className="font-semibold">
              {p.golsPro != null && p.golsContra != null
                ? <span className={p.golsPro > p.golsContra ? "text-success-600" : p.golsPro < p.golsContra ? "text-danger-600" : ""}>
                    {p.golsPro} × {p.golsContra}
                  </span>
                : <span className="text-muted-foreground">—</span>
              }
            </TableCell>
            <TableCell>{resultadoBadge(p.resultado)}</TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Link href={`/campeonatos/${campeonatoId}/partidas/${p.id}/escalacao`}>
                  <Button size="icon-sm" variant="ghost" aria-label="Convocação" className={convocacoesMap.has(p.id) ? "text-success-600" : ""}>
                    <Shirt className="size-3.5" aria-hidden="true" />
                  </Button>
                </Link>
                <Button size="icon-sm" variant="ghost" onClick={() => openScore(p)} aria-label="Registrar placar">
                    <Pencil className="size-3.5" aria-hidden="true" />
                </Button>
                <ConfirmDialog title="Deletar partida?" description="Esta ação não pode ser desfeita." confirmLabel="Deletar" onConfirm={() => handleDelete(p.id)}>
                  <Button size="icon-sm" variant="ghost" aria-label="Deletar partida">
                    <Trash2 className="size-3.5 text-danger-600" aria-hidden="true" />
                  </Button>
                </ConfirmDialog>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </div>
  )
}
