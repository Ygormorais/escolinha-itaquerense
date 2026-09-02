"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { encerrarPendenciaDesenvolvimento } from "@/app/actions/pendencias-desenvolvimento"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

export function EncerrarCiclo({ id, titulo, alunoNome, updatedAt, onEncerrado }: {
  id: number; titulo: string; alunoNome: string; updatedAt: string; onEncerrado?: (id: number) => void
}) {
  const [status, setStatus] = useState<"concluida" | "ignorada" | null>(null)
  const [versao, setVersao] = useState(updatedAt)
  const [nota, setNota] = useState("")
  const [erro, setErro] = useState("")
  const [conflito, setConflito] = useState(false)
  const [pending, startTransition] = useTransition()
  const abrir = (value: "concluida" | "ignorada") => {
    setStatus(value); setVersao(updatedAt); setNota(""); setErro(""); setConflito(false)
  }
  const salvar = () => {
    if (!status) return
    startTransition(async () => {
      try {
        const result = await encerrarPendenciaDesenvolvimento({ id, status, versao, observacao: nota })
        if (result.error) { setErro(result.error); setConflito(result.conflito ?? false); return }
        setStatus(null)
        onEncerrado?.(id)
        toast.success("Pendência encerrada no ciclo original.")
      } catch { setErro("Não foi possível confirmar o encerramento. Seu texto foi mantido; verifique sua sessão e tente novamente.") }
    })
  }
  return <>
    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
      <Button size="sm" variant="outline" onClick={() => abrir("concluida")}>Concluir pendência</Button>
      <Button size="sm" variant="outline" onClick={() => abrir("ignorada")}>Ignorar pendência</Button>
    </div>
    <Dialog open={status !== null} onOpenChange={(open) => { if (!open && !pending) setStatus(null) }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{status === "concluida" ? "Concluir pendência registrada" : "Ignorar pendência registrada"}</DialogTitle><DialogDescription>{alunoNome} — {titulo}. O registro será atualizado no ciclo original, mesmo que o indicador não esteja mais ativo.</DialogDescription></DialogHeader>
        <Label htmlFor={`cycle-result-${id}`}>{status === "concluida" ? "Resultado da pendência" : "Justificativa da pendência"}</Label>
        <Textarea id={`cycle-result-${id}`} value={nota} onChange={(event) => setNota(event.target.value)} maxLength={500} rows={4} disabled={pending} />
        <p className="text-xs text-muted-foreground">Este texto passa a ser o registro de resultado ou justificativa do ciclo.</p>
        {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
        <DialogFooter><Button variant="outline" disabled={pending} onClick={() => setStatus(null)}>Cancelar</Button><Button disabled={pending || conflito || nota.trim().length < 3} onClick={salvar}>{pending ? "Salvando..." : "Confirmar encerramento"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </>
}
