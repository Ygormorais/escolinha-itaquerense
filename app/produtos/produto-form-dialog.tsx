"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { criarProduto, atualizarProduto } from "@/app/actions/produtos"
import { dadosDoProduto, defaultForm, formDoProduto, type Produto, type ProdutoForm } from "./produtos-utils"

/**
 * O formulário nasce do `produto` (ou vazio, se for novo). Quem usa troca a `key`
 * a cada abertura para remontar o componente e descartar o que foi digitado antes.
 */
export function ProdutoFormDialog({
  open,
  onOpenChange,
  produto,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  produto: Produto | null
}) {
  const router = useRouter()
  const [isPending, startPending] = useTransition()
  const [form, setForm] = useState<ProdutoForm>(produto ? formDoProduto(produto) : defaultForm)
  const editingId = produto?.id ?? null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startPending(async () => {
      try {
        const data = dadosDoProduto(form)
        if (editingId) {
          const r = await atualizarProduto(editingId, data)
          if (r && "error" in r) { toast.error(r.error); return }
          toast.success("Produto atualizado!")
        } else {
          const r = await criarProduto(data)
          if (r && "error" in r) { toast.error(r.error); return }
          toast.success("Produto criado!")
        }
        onOpenChange(false)
        router.refresh()
      } catch {
        toast.error("Erro ao salvar produto")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingId ? "Editar produto" : "Novo produto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prod-nome">Nome</Label>
            <Input
              id="prod-nome"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prod-desc">Descrição</Label>
            <Textarea
              id="prod-desc"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prod-preco">Preço (R$)</Label>
              <Input
                id="prod-preco"
                type="number"
                step="0.01"
                min="0"
                value={form.preco}
                onChange={(e) => setForm({ ...form, preco: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={form.categoria}
                onValueChange={(v) => setForm({ ...form, categoria: v ?? "uniforme" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uniforme">Uniforme</SelectItem>
                  <SelectItem value="acessorio">Acessório</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="prod-tamanhos">Tamanhos</Label>
            <Input
              id="prod-tamanhos"
              value={form.tamanhos}
              onChange={(e) => setForm({ ...form, tamanhos: e.target.value })}
              placeholder="Ex: P, M, G, GG ou Único"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prod-estoque">Estoque</Label>
              <Input
                id="prod-estoque"
                type="number"
                min="0"
                value={form.estoque}
                onChange={(e) => setForm({ ...form, estoque: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prod-imagem">Imagem (URL)</Label>
              <Input
                id="prod-imagem"
                value={form.imagem}
                onChange={(e) => setForm({ ...form, imagem: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
              className="size-4 rounded border-input"
            />
            Produto ativo
          </label>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : (editingId ? "Atualizar" : "Criar")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
