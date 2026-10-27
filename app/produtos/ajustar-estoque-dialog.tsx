"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { History, Loader2, PackageOpen, TrendingDown, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ajustarEstoque, getMovimentosEstoque } from "@/app/actions/produtos"
import type { Movimento, Produto } from "./produtos-utils"

export function AjustarEstoqueDialog({ produto, onDone }: { produto: Produto; onDone: () => void }) {
  const [open, setOpen] = useState(false)
  const [tipo, setTipo] = useState<"entrada" | "saida">("entrada")
  const [quantidade, setQuantidade] = useState("1")
  const [motivo, setMotivo] = useState("")
  const [movimentos, setMovimentos] = useState<Movimento[] | null>(null)
  const [tab, setTab] = useState<"ajustar" | "historico">("ajustar")
  const [pending, startPending] = useTransition()

  async function handleOpen() {
    setOpen(true)
    const result = await getMovimentosEstoque(produto.id)
    setMovimentos(result as Movimento[])
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startPending(async () => {
      const qtd = Number(quantidade)
      if (!qtd || qtd <= 0) { toast.error("Quantidade inválida"); return }
      const result = await ajustarEstoque(produto.id, tipo, qtd, motivo || undefined)
      if (result && "error" in result) { toast.error(result.error); return }
      toast.success(tipo === "entrada" ? `+${qtd} unidades adicionadas` : `-${qtd} unidades removidas`)
      setOpen(false)
      setQuantidade("1")
      setMotivo("")
      onDone()
    })
  }

  return (
    <>
      <Button variant="ghost" size="icon" onClick={handleOpen} aria-label="Ajustar estoque">
        <History className="size-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{produto.nome} — Estoque: {produto.estoque}</DialogTitle>
          </DialogHeader>
          <div className="flex gap-1 rounded-lg border border-border bg-muted p-1 w-fit mb-3">
            {(["ajustar", "historico"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t === "ajustar" ? "Ajustar" : "Histórico"}
              </button>
            ))}
          </div>

          {tab === "ajustar" ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTipo("entrada")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${tipo === "entrada" ? "border-success-600 bg-success-50 text-success-600" : "border-border text-muted-foreground"}`}
                >
                  <TrendingUp className="size-4" /> Entrada
                </button>
                <button
                  type="button"
                  onClick={() => setTipo("saida")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${tipo === "saida" ? "border-destructive bg-destructive/10 text-destructive" : "border-border text-muted-foreground"}`}
                >
                  <TrendingDown className="size-4" /> Saída
                </button>
              </div>
              <div>
                <Label>Quantidade</Label>
                <Input type="number" min="1" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} className="mt-1" required />
              </div>
              <div>
                <Label>Motivo (opcional)</Label>
                <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex: recebimento de fornecedor" className="mt-1" />
              </div>
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? <Loader2 className="size-4 animate-spin" /> : tipo === "entrada" ? "Adicionar ao estoque" : "Remover do estoque"}
              </Button>
            </form>
          ) : (
            <div className="divide-y rounded-lg border">
              {!movimentos || movimentos.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <PackageOpen className="size-7 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Nenhum movimento registrado.</p>
                </div>
              ) : movimentos.map((m) => (
                <div key={m.id} className="flex items-center justify-between px-3 py-2">
                  <div>
                    <span className={`text-sm font-semibold ${m.tipo === "entrada" ? "text-success-600" : "text-destructive"}`}>
                      {m.tipo === "entrada" ? "+" : "−"}{m.quantidade}
                    </span>
                    {m.motivo && <span className="ml-2 text-xs text-muted-foreground">{m.motivo}</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(m.createdAt), "dd/MM/yy HH:mm", { locale: ptBR })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
