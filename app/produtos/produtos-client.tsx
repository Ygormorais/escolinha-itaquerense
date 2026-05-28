"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Image from "next/image"
import { Plus, ShoppingBag, Pencil, Trash2, CheckCircle, XCircle } from "lucide-react"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  criarProduto,
  atualizarProduto,
  removerProduto,
} from "@/app/actions/produtos"

type Produto = {
  id: number
  nome: string
  descricao: string | null
  preco: number
  categoria: string
  tamanhos: string | null
  ativo: boolean
  imagem: string | null
  createdAt: Date
}

type ProdutoForm = {
  nome: string
  descricao: string
  preco: string
  categoria: string
  tamanhos: string
  ativo: boolean
  imagem: string
}

const defaultForm: ProdutoForm = {
  nome: "",
  descricao: "",
  preco: "",
  categoria: "uniforme",
  tamanhos: "",
  ativo: true,
  imagem: "",
}

const categoriaLabel: Record<string, string> = {
  uniforme: "Uniforme",
  acessorio: "Acessório",
  outro: "Outro",
}

export function ProdutosClient({ produtos }: { produtos: Produto[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [form, setForm] = useState<ProdutoForm>(defaultForm)

  function openNew() {
    setEditingId(null)
    setForm(defaultForm)
    setOpen(true)
  }

  function openEdit(p: Produto) {
    setEditingId(p.id)
    setForm({
      nome: p.nome,
      descricao: p.descricao ?? "",
      preco: String(p.preco),
      categoria: p.categoria,
      tamanhos: p.tamanhos ?? "",
      ativo: p.ativo,
      imagem: p.imagem ?? "",
    })
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsPending(true)
    try {
      const data = {
        nome: form.nome,
        descricao: form.descricao || undefined,
        preco: Number(form.preco),
        categoria: form.categoria || undefined,
        tamanhos: form.tamanhos || undefined,
        ativo: form.ativo,
        imagem: form.imagem || undefined,
      }
      if (editingId) {
        await atualizarProduto(editingId, data)
        toast.success("Produto atualizado!")
      } else {
        await criarProduto(data)
        toast.success("Produto criado!")
      }
      setOpen(false)
      router.refresh()
    } catch {
      toast.error("Erro ao salvar produto")
    } finally {
      setIsPending(false)
    }
  }

  async function handleRemover(id: number, nome: string) {
    if (!confirm(`Remover "${nome}"?`)) return
    try {
      await removerProduto(id)
      toast.success("Produto removido!")
      router.refresh()
    } catch {
      toast.error("Erro ao remover produto")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold tracking-tight flex items-center gap-2">
          <ShoppingBag className="size-6 text-brand-600" />
          Produtos
        </h1>
        <Button size="sm" onClick={openNew}>
          <Plus className="size-4" /> Novo Produto
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preço (R$)</Label>
                <Input
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
              <Label>Tamanhos</Label>
              <Input
                value={form.tamanhos}
                onChange={(e) => setForm({ ...form, tamanhos: e.target.value })}
                placeholder="Ex: P, M, G, GG ou Único"
              />
            </div>
            <div className="space-y-2">
              <Label>Imagem (URL)</Label>
              <Input
                value={form.imagem}
                onChange={(e) => setForm({ ...form, imagem: e.target.value })}
                placeholder="https://..."
              />
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
              {isPending ? "Salvando..." : editingId ? "Atualizar" : "Criar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {produtos.length === 0 ? (
        <p className="text-muted-foreground">Nenhum produto cadastrado.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Preview</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Tamanhos</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {produtos.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[12px] border border-border bg-muted">
                    {p.imagem ? (
                      <Image
                        src={p.imagem}
                        alt={p.nome}
                        width={56}
                        height={56}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ShoppingBag className="size-5 text-muted-foreground" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{p.nome}</TableCell>
                <TableCell>R$ {p.preco.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {categoriaLabel[p.categoria] ?? p.categoria}
                  </Badge>
                </TableCell>
                <TableCell>{p.tamanhos ?? "—"}</TableCell>
                <TableCell>
                  {p.ativo ? (
                    <Badge
                      variant="default"
                      className="gap-1 bg-green-600 text-white"
                    >
                      <CheckCircle className="size-3" /> Sim
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <XCircle className="size-3" /> Não
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(p)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleRemover(p.id, p.nome)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
