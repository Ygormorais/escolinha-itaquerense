"use client"

import { useState, useTransition } from "react"
import { Check, X } from "lucide-react"
import { toast } from "sonner"
import { responderDisponibilidade } from "@/app/actions/disponibilidade"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type Resposta = "disponivel" | "indisponivel"

export function DisponibilidadeCard({
  tipo,
  referenciaId,
  alunoId,
  alunoNome,
  respostaInicial,
  motivoInicial,
  compacto = false,
}: {
  tipo: "partida" | "evento"
  referenciaId: number
  alunoId: number
  alunoNome: string
  respostaInicial: string | null
  motivoInicial?: string | null
  compacto?: boolean
}) {
  const [resposta, setResposta] = useState<Resposta | null>(
    respostaInicial === "disponivel" || respostaInicial === "indisponivel" ? respostaInicial : null,
  )
  const [motivo, setMotivo] = useState(motivoInicial ?? "")
  const [salvando, startTransition] = useTransition()

  function salvar(novaResposta: Resposta) {
    startTransition(async () => {
      const resultado = await responderDisponibilidade(tipo, referenciaId, alunoId, novaResposta, motivo)
      if ("error" in resultado) {
        toast.error(resultado.error)
        return
      }
      setResposta(novaResposta)
      toast.success(novaResposta === "disponivel" ? "Disponibilidade confirmada" : "Indisponibilidade registrada")
    })
  }

  return (
    <div className={cn("space-y-2 rounded-xl border border-border bg-background/70 p-3", compacto && "p-2.5")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-foreground">
          {alunoNome}: pode participar?
        </p>
        {resposta && (
          <span className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            resposta === "disponivel" ? "bg-success-50 text-success-700" : "bg-destructive/10 text-destructive",
          )}>
            {resposta === "disponivel" ? "Disponível" : "Indisponível"}
          </span>
        )}
      </div>
      <Input
        value={motivo}
        onChange={(event) => setMotivo(event.target.value)}
        maxLength={240}
        placeholder="Observação opcional"
        aria-label={`Observação sobre a disponibilidade de ${alunoNome}`}
        className="h-9 text-xs"
      />
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          size="sm"
          variant={resposta === "disponivel" ? "default" : "outline"}
          disabled={salvando}
          onClick={() => salvar("disponivel")}
          className={cn(resposta === "disponivel" && "bg-success-600 text-white hover:bg-success-700")}
        >
          <Check className="size-3.5" aria-hidden /> Posso ir
        </Button>
        <Button
          type="button"
          size="sm"
          variant={resposta === "indisponivel" ? "destructive" : "outline"}
          disabled={salvando}
          onClick={() => salvar("indisponivel")}
        >
          <X className="size-3.5" aria-hidden /> Não posso
        </Button>
      </div>
    </div>
  )
}
