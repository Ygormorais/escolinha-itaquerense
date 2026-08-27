import Link from "next/link"
import { format } from "date-fns"
import { CalendarDays, CircleDollarSign, MapPin, Trophy, Users, Wifi, WifiOff } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn, formatMoney, plural } from "@/lib/utils"
import type { Campeonato } from "./types"

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  aberto: {
    label: "Aberto",
    className: "border-success-600/20 bg-success-50 text-success-600",
  },
  andamento: {
    label: "Em Andamento",
    className: "border-brand-200 bg-brand-50 text-brand-800",
  },
  encerrado: {
    label: "Encerrado",
    className: "border-border bg-muted text-muted-foreground",
  },
}

export function CampeonatoCard({ campeonato }: { campeonato: Campeonato }) {
  const status = STATUS_MAP[campeonato.status] ?? STATUS_MAP.aberto

  return (
    <Link
      href={`/campeonatos/${campeonato.id}`}
      aria-label={`Abrir campeonato ${campeonato.nome}`}
      className="block h-full rounded-[var(--radius-card)] outline-none focus-visible:ring-4 focus-visible:ring-ring/15"
    >
      <Card
        data-slot="campeonato-card"
        className="h-full border-border/80 bg-card shadow-sm transition-colors duration-200 hover:border-brand-200 hover:bg-brand-50/20"
      >
        <CardHeader className="gap-3 pb-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-800 ring-1 ring-brand-100">
              <Trophy className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="[overflow-wrap:anywhere] text-base font-bold leading-snug text-foreground">
                {campeonato.nome}
              </CardTitle>
              {campeonato.descricao && (
                <CardDescription className="mt-1 line-clamp-2 leading-relaxed">
                  {campeonato.descricao}
                </CardDescription>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn("shrink-0", status.className)}>
              {status.label}
            </Badge>
            {campeonato.fpfsEventoId != null ? (
              <Badge variant="outline" className="shrink-0 border-success-600/20 bg-success-50 text-success-600">
                <Wifi className="size-3" aria-hidden="true" /> FPFS
              </Badge>
            ) : (
              <Badge variant="outline" className="shrink-0 border-border bg-muted text-muted-foreground">
                <WifiOff className="size-3" aria-hidden="true" /> Sem FPFS
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 border-t border-border/70 pt-4 text-sm">
          <div className="flex min-w-0 items-start gap-2 text-muted-foreground">
            <CalendarDays className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 [overflow-wrap:anywhere]">
              {format(new Date(campeonato.dataInicio), "dd/MM/yyyy")}
              {campeonato.dataFim && ` — ${format(new Date(campeonato.dataFim), "dd/MM/yyyy")}`}
            </span>
          </div>
          {campeonato.local && (
            <div className="flex min-w-0 items-start gap-2 text-muted-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 [overflow-wrap:anywhere]">{campeonato.local}</span>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-foreground">
            <span className="inline-flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" aria-hidden="true" />
              {plural(campeonato._count.inscricoes, "inscrito", "inscritos", "nenhum")}
            </span>
            <span data-numeric className="inline-flex items-center gap-2 font-semibold text-brand-800">
              <CircleDollarSign className="size-4" aria-hidden="true" />
              {formatMoney(campeonato.taxaInscricao)} taxa
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

