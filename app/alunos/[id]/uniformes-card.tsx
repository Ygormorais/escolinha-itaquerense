"use client"

import { useState, useTransition } from "react"
import { Shirt, Plus, CheckCircle, Trash2, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { adicionarUniforme, marcarEntregue, removerUniforme } from "@/app/actions/uniformes"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { format } from "date-fns"
import { useRouter } from "next/navigation"

type Uniforme = {
  id: number
  item: string
  tamanho: string | null
  entregue: boolean
  dataEntrega: Date | null
  observacoes: string | null
}

const ITENS_PADRAO = ["Camisa", "Short", "Meião", "Chuteira", "Colete", "Agasalho"]

export function UniformesCard({ alunoId, uniformes }: { alunoId: number; uniformes: Uniforme[] }) {
  const router = useRouter()
  const [addOpen, setAddOpen] = useState(false)
  const [item, setItem] = useState("")
  const [tamanho, setTamanho] = useState("")
  const [obs, setObs] = useState("")
  const [pending, start] = useTransition()

  function handleAdicionar() {
    if (!item.trim()) return
    start(async () => {
      const r = await adicionarUniforme(alunoId, { item: item.trim(), tamanho: tamanho.trim() || undefined, observacoes: obs.trim() || undefined })
      if ("error" in r) { toast.error(r.error); return }
      setItem(""); setTamanho(""); setObs(""); setAddOpen(false)
      router.refresh()
    })
  }

  function handleEntregue(id: number) {
    start(async () => {
      const r = await marcarEntregue(id, alunoId)
      if ("error" in r) toast.error(r.error)
      else router.refresh()
    })
  }

  function handleRemover(id: number) {
    start(async () => {
      const r = await removerUniforme(id, alunoId)
      if ("error" in r) toast.error(r.error)
      else router.refresh()
    })
  }

  const entregues = uniformes.filter((u) => u.entregue).length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shirt className="size-4 text-brand-800" />
            Uniformes
            <span className="text-xs font-normal text-muted-foreground">({entregues}/{uniformes.length} entregues)</span>
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setAddOpen(!addOpen)}>
            <Plus className="size-4" />
            Adicionar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {addOpen && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="uni-item" className="text-xs text-muted-foreground">Item</Label>
                <div className="mt-1 flex flex-wrap gap-1 mb-2">
                  {ITENS_PADRAO.map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setItem(i)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                        item === i ? "bg-brand-800 text-white" : "bg-muted hover:bg-muted/80 text-muted-foreground"
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
                <Input
                  id="uni-item"
                  value={item}
                  onChange={(e) => setItem(e.target.value)}
                  placeholder="Ou digite outro item..."
                  className="text-sm"
                />
              </div>
              <div className="w-28">
                <Label htmlFor="uni-tamanho" className="text-xs text-muted-foreground">Tamanho</Label>
                <Input
                  id="uni-tamanho"
                  value={tamanho}
                  onChange={(e) => setTamanho(e.target.value)}
                  placeholder="Ex: M, 14"
                  className="mt-1 text-sm"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="uni-obs" className="text-xs text-muted-foreground">Observações</Label>
              <Input
                id="uni-obs"
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                placeholder="Opcional..."
                className="mt-1 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdicionar} disabled={pending || !item.trim()} className="bg-brand-800 text-white hover:bg-brand-900">
                {pending ? <Loader2 className="size-4 animate-spin" /> : "Salvar"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAddOpen(false)}>Cancelar</Button>
            </div>
          </div>
        )}

        {uniformes.length === 0 && !addOpen && (
          <p className="text-sm text-muted-foreground py-2">Nenhum uniforme registrado.</p>
        )}

        <div className="space-y-2">
          {uniformes.map((u) => (
            <div
              key={u.id}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                u.entregue ? "bg-success-50 border border-success-600/20" : "bg-muted/40 border border-border"
              }`}
            >
              <div className="flex-1 min-w-0">
                <span className="font-medium">{u.item}</span>
                {u.tamanho && <span className="ml-2 text-xs text-muted-foreground">({u.tamanho})</span>}
                {u.observacoes && <p className="text-xs text-muted-foreground mt-0.5">{u.observacoes}</p>}
                {u.entregue && u.dataEntrega && (
                  <p className="text-xs text-success-600 mt-0.5">
                    Entregue em {format(u.dataEntrega, "dd/MM/yyyy")}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                {!u.entregue && (
                  <Button size="icon-sm" variant="ghost" aria-label="Marcar como entregue" onClick={() => handleEntregue(u.id)} disabled={pending}>
                    <CheckCircle className="size-4 text-success-600" />
                  </Button>
                )}
                <Button size="icon-sm" variant="ghost" aria-label="Remover item de uniforme" onClick={() => handleRemover(u.id)} disabled={pending}>
                  <Trash2 className="size-4 text-danger-600" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
