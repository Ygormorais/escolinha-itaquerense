"use client"

import { useState, useMemo } from "react"
import { sanitizeCSVCell, plural } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  CreditCard, UserPlus, UserX, UserCheck, CalendarCheck,
  Receipt, Settings, AlertCircle, Clock, Download, Search,
  Trophy, Trash2, Pencil, UserCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/layout/page-header"
import type { RscDate } from "@/lib/rsc-date"

type Log = {
  id: number
  tipo: string
  descricao: string
  usuario: string | null
  meta: string | null
  createdAt: RscDate
}

const TIPO_CONFIG: Record<string, { icon: React.ElementType; cor: string; label: string }> = {
  pagamento: { icon: CreditCard, cor: "text-success-600 bg-success-50", label: "Pagamento" },
  pagamento_pago: { icon: CreditCard, cor: "text-success-600 bg-success-50", label: "Pagamento" },
  pagamento_excluido: { icon: Trash2, cor: "text-danger-600 bg-danger-50", label: "Exclusão" },
  aluno_novo: { icon: UserPlus, cor: "text-brand-600 bg-brand-50", label: "Novo aluno" },
  aluno_editado: { icon: Pencil, cor: "text-info-600 bg-info-50", label: "Edição" },
  aluno_inativo: { icon: UserX, cor: "text-danger-600 bg-danger-50", label: "Inativação" },
  aluno_reativo: { icon: UserCheck, cor: "text-success-600 bg-success-50", label: "Reativação" },
  frequencia: { icon: CalendarCheck, cor: "text-info-600 bg-info-50", label: "Frequência" },
  recibo: { icon: Receipt, cor: "text-violet-600 bg-violet-50", label: "Recibo" },
  config: { icon: Settings, cor: "text-muted-foreground bg-muted", label: "Configuração" },
  inadimplencia: { icon: AlertCircle, cor: "text-warning-600 bg-warning-50", label: "Inadimplência" },
  evento_criado: { icon: CalendarCheck, cor: "text-brand-600 bg-brand-50", label: "Evento" },
  evento_editado: { icon: Pencil, cor: "text-info-600 bg-info-50", label: "Evento" },
  evento_excluido: { icon: Trash2, cor: "text-danger-600 bg-danger-50", label: "Evento" },
  custo_novo: { icon: Receipt, cor: "text-warning-600 bg-warning-50", label: "Custo" },
  campeonato_criado: { icon: Trophy, cor: "text-brand-600 bg-brand-50", label: "Campeonato" },
  escalacao_chatbot: { icon: AlertCircle, cor: "text-warning-600 bg-warning-50", label: "Chatbot" },
}

export function HistoricoClient({ logs }: { logs: Log[] }) {
  const [search, setSearch] = useState("")
  const [filtroTipo, setFiltroTipo] = useState("todos")
  const [filtroUsuario, setFiltroUsuario] = useState("todos")

  const usuarios = useMemo(() => {
    const set = new Set(logs.filter((l) => l.usuario).map((l) => l.usuario!))
    return Array.from(set).sort()
  }, [logs])

  const tipos = useMemo(() => {
    const set = new Set(logs.map((l) => l.tipo))
    return Array.from(set).sort()
  }, [logs])

  const filtrados = useMemo(() => {
    return logs.filter((l) => {
      if (filtroTipo !== "todos" && l.tipo !== filtroTipo) return false
      if (filtroUsuario !== "todos" && l.usuario !== filtroUsuario) return false
      if (search && !l.descricao.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [logs, filtroTipo, filtroUsuario, search])

  const groups = useMemo(() => {
    const map = new Map<string, Log[]>()
    for (const log of filtrados) {
      const key = format(new Date(log.createdAt), "yyyy-MM-dd")
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(log)
    }
    return map
  }, [filtrados])

  function exportarCSV() {
    const header = "Data;Hora;Tipo;Descrição;Usuário;Meta"
    const rows = filtrados.map((l) => {
      const d = new Date(l.createdAt)
      return [
        format(d, "dd/MM/yyyy"),
        format(d, "HH:mm"),
        l.tipo,
        l.descricao,
        l.usuario ?? "",
        l.meta ?? "",
      ].map(sanitizeCSVCell).join(";")
    })
    const csv = "\uFEFF" + header + "\n" + rows.join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `historico-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Histórico de Atividades"
        description={`${plural(filtrados.length, "registro", "registros", "nenhum")}${logs.length >= 500 ? " · exibindo os 500 mais recentes" : ""}`}
        action={
          <Button size="sm" onClick={exportarCSV}>
            <Download className="size-4 mr-1" /> CSV
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} aria-label="Filtrar por tipo">
          <option value="todos">Todos tipos</option>
          {tipos.map((t) => (
            <option key={t} value={t}>{TIPO_CONFIG[t]?.label ?? t}</option>
          ))}
        </select>
        {usuarios.length > 0 && (
          <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={filtroUsuario} onChange={(e) => setFiltroUsuario(e.target.value)} aria-label="Filtrar por usuário">
            <option value="todos">Todos usuários</option>
            {usuarios.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        )}
      </div>

      {filtrados.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhuma atividade encontrada.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Array.from(groups.entries()).map(([date, items]) => {
            const dataLabel = format(new Date(date + "T12:00:00"), "EEEE, dd 'de' MMMM", { locale: ptBR })
            return (
              <div key={date}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground capitalize">
                  {dataLabel}
                </p>
                <Card>
                  <CardContent className="divide-y p-0">
                    {items.map((log) => {
                      const cfg = TIPO_CONFIG[log.tipo] ?? {
                        icon: Clock,
                        cor: "text-muted-foreground bg-muted",
                        label: log.tipo,
                      }
                      const Icon = cfg.icon
                      return (
                        <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                          <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${cfg.cor}`}>
                            <Icon className="size-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-snug">{log.descricao}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {log.usuario && (
                                <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                                  <UserCircle className="size-3" /> {log.usuario}
                                </Badge>
                              )}
                              {log.meta && (() => {
                                try {
                                  const m = JSON.parse(log.meta) as Record<string, string>
                                  return (
                                    <p className="text-xs text-muted-foreground">
                                      {Object.entries(m).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                                    </p>
                                  )
                                } catch { return null }
                              })()}
                            </div>
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {format(new Date(log.createdAt), "HH:mm")}
                          </span>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
