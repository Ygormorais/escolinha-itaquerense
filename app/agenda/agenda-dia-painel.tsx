"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Plus, Pencil, Trash2, MessageCircle, CalendarX } from "lucide-react"
import { cn } from "@/lib/utils"
import { nomeTime } from "@/lib/landing/times"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { doDia, extrasDoDia, mensagemEvento, mensagemJogo, tipoStyles, type AgendaExtras, type Evento, type Jogo } from "./agenda-utils"

function abrirWhatsApp(msg: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer")
}

/** Painel lateral: eventos e jogos do dia selecionado, mais a legenda de cores. */
export function AgendaDiaPainel({
  selectedDate,
  eventos,
  jogos,
  extras,
  onNovo,
  onEditar,
  onDelete,
}: {
  selectedDate: Date | null
  eventos: Evento[]
  jogos: Jogo[]
  extras: AgendaExtras
  onNovo: (date: Date) => void
  onEditar: (evento: Evento) => void
  onDelete: (id: number) => Promise<void>
}) {
  const eventosDoDia = (date: Date) => doDia(eventos, date)
  const jogosDoDia = (date: Date) => doDia(jogos, date)
  const totalDoDia = (date: Date) => {
    const x = extrasDoDia(extras, date)
    return eventosDoDia(date).length + jogosDoDia(date).length + x.treinos.length + x.bloqueios.length + (x.feriado ? 1 : 0)
  }
  const avisarEvento = (ev: Evento) => abrirWhatsApp(mensagemEvento(ev))
  const avisarJogo = (j: Jogo) => abrirWhatsApp(mensagemJogo(j))

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-heading">
            {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : "Selecione uma data"}
          </CardTitle>
          {selectedDate && (
            <Button size="sm" variant="outline" onClick={() => onNovo(selectedDate)} className="gap-1">
              <Plus className="size-3" /> Novo
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {selectedDate && totalDoDia(selectedDate) === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <CalendarX className="size-7 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Nenhum evento neste dia</p>
            </div>
          )}

          {/* Feriado, bloqueios e treinos do dia (derivados, somente leitura) */}
          {selectedDate && (() => {
            const x = extrasDoDia(extras, selectedDate)
            return (
              <>
                {x.feriado && (
                  <div className={cn("rounded-lg border p-3 mb-2", tipoStyles.Feriado)} data-slot="agenda-feriado">
                    <p className="text-sm font-semibold">Feriado: {x.feriado}</p>
                  </div>
                )}
                {x.bloqueios.map((b) => (
                  <div key={`b${b.id}`} className={cn("rounded-lg border p-3 mb-2", tipoStyles["Quadra bloqueada"])} data-slot="agenda-bloqueio">
                    <p className="text-sm font-semibold">Quadra bloqueada</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{b.motivo}</p>
                  </div>
                ))}
                {x.treinos.map((t) => (
                  <div key={t.chave} className={cn("rounded-lg border p-3 mb-2", tipoStyles.Treino, t.cancelado && "opacity-70")} data-slot="agenda-treino">
                    <p className={cn("text-sm font-semibold", t.cancelado && "line-through")}>{t.titulo}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Treino · {t.hora}
                      {t.cancelado && ` · Cancelado (${t.motivo})`}
                    </p>
                  </div>
                ))}
              </>
            )
          })()}

          {/* Jogos (somente leitura — vêm das partidas) */}
          {selectedDate && jogosDoDia(selectedDate).map((j) => (
            <div key={`j${j.id}`} className={cn("rounded-lg border p-3 mb-2", tipoStyles.Jogo)}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">Jogo vs {nomeTime(j.adversario)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(j.data), "HH:mm")} · {j.local}
                    {j.campeonato && ` · ${j.campeonato}`}
                  </p>
                  {j.placar && <p className="text-xs font-semibold mt-0.5">{j.resultado ?? ""} {j.placar}</p>}
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => avisarJogo(j)} aria-label="Avisar no WhatsApp" title="Avisar no WhatsApp">
                  <MessageCircle className="size-3.5 text-success-600" />
                </Button>
              </div>
            </div>
          ))}

          {/* Eventos (editáveis) */}
          {selectedDate && eventosDoDia(selectedDate).map((ev) => (
            <div key={`e${ev.id}`} className={cn("rounded-lg border p-3 mb-2", tipoStyles[ev.tipo] ?? "")}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{ev.titulo}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {ev.tipo}
                    {ev.turmas && ev.turmas !== "Todas" && ` · ${ev.turmas}`}
                    {ev.local && ` · ${ev.local}`}
                  </p>
                  {(ev.horaInicio || ev.horaFim) && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ev.horaInicio}{ev.horaInicio && ev.horaFim && " — "}{ev.horaFim}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon-sm" onClick={() => avisarEvento(ev)} aria-label="Avisar no WhatsApp" title="Avisar no WhatsApp">
                    <MessageCircle className="size-3.5 text-success-600" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => onEditar(ev)} aria-label="Editar evento">
                    <Pencil className="size-3" />
                  </Button>
                  <ConfirmDialog title="Excluir evento?" description="Esta ação não pode ser desfeita." onConfirm={() => onDelete(ev.id)}>
                    <Button variant="ghost" size="icon-sm" aria-label="Excluir evento">
                      <Trash2 className="size-3 text-danger-600" />
                    </Button>
                  </ConfirmDialog>
                </div>
              </div>
              {ev.descricao && (
                <p className="text-xs text-muted-foreground mt-2">{ev.descricao}</p>
              )}
            </div>
          ))}

          {!selectedDate && (
            <p className="text-sm text-muted-foreground text-center py-4">Clique em um dia para ver os eventos (duplo-clique cria um novo).</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-heading">Legenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(tipoStyles).map(([tipo, cls]) => (
              <div key={tipo} className="flex items-center gap-2">
                <div className={cn("h-3 w-3 rounded border", cls.split(" ")[0])} />
                <span className="text-xs">{tipo}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
