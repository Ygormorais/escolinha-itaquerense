"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Image from "next/image"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Plus, ShoppingBag, Pencil, Trash2, CheckCircle, XCircle, Loader2, TrendingUp, TrendingDown, History, PackageOpen } from "lucide-react"
import { formatMoney } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { EmptyState } from "@/components/ui/empty-state"
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
  ajustarEstoque,
  getMovimentosEstoque,
} from "@/app/actions/produtos"

type Movimento = {
  id: number
  tipo: string
  quantidade: number
  motivo: string | null
  createdAt: Date
}

function AjustarEstoqueDialog({ produto, onDone }: { produto: Produto; onDone: () => void }) {
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

type Produto = {
  id: number
  nome: string
  descricao: string | null
  preco: number
  categoria: string
  tamanhos: string | null
  estoque: number
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
  estoque: string
  ativo: boolean
  imagem: string
}

const defaultForm: ProdutoForm = {
  nome: "",
  descricao: "",
  preco: "",
  categoria: "uniforme",
  tamanhos: "",
  estoque: "0",
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
  const [isPending, startPending] = useTransition()
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
      estoque: String(p.estoque),
      ativo: p.ativo,
      imagem: p.imagem ?? "",
    })
    setOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startPending(async () => {
      try {
        const data = {
          nome: form.nome,
          descricao: form.descricao || undefined,
          preco: Number(form.preco),
          categoria: form.categoria || undefined,
          tamanhos: form.tamanhos || undefined,
          estoque: Number(form.estoque),
          ativo: form.ativo,
          imagem: form.imagem || undefined,
        }
        if (editingId) {
          const r = await atualizarProduto(editingId, data)
          if (r && "error" in r) { toast.error(r.error); return }
          toast.success("Produto atualizado!")
        } else {
          const r = await criarProduto(data)
          if (r && "error" in r) { toast.error(r.error); return }
          toast.success("Produto criado!")
        }
        setOpen(false)
        router.refresh()
      } catch {
        toast.error("Erro ao salvar produto")
      }
    })
  }

  async function handleRemover(id: number, _nome: string) {
    try {
      await removerProduto(id)
      toast.success("Produto removido!")
      router.refresh()
    } catch {
      toast.error("Erro ao remover produto")
    }
  }

  return (
    <div className="space-y-6 bg-[var(--color-paper-50)]/40 p-6 lg:p-8 dark:bg-transparent">
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

      {produtos.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="Nenhum produto cadastrado" description="Adicione produtos para a lojinha." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Preview</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Estoque</TableHead>
              <TableHead>Tamanhos</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {produtos.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
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
                <TableCell>{formatMoney(p.preco)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {categoriaLabel[p.categoria] ?? p.categoria}
                  </Badge>
                </TableCell>
                <TableCell>
                  {p.estoque > 0 ? (
                    <Badge variant="default" className="bg-success-600">{p.estoque}</Badge>
                  ) : (
                    <Badge variant="outline" className="text-danger-600">0</Badge>
                  )}
                </TableCell>
                <TableCell>{p.tamanhos ?? "—"}</TableCell>
                <TableCell>
                  {p.ativo ? (
                    <Badge
                      variant="default"
                      className="gap-1 bg-success-600 text-white"
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
                    <AjustarEstoqueDialog produto={p} onDone={() => router.refresh()} />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(p)}
                      aria-label="Editar produto"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <ConfirmDialog title="Remover produto?" description={`Remover "${p.nome}" permanentemente?`} confirmLabel="Remover" onConfirm={() => handleRemover(p.id, p.nome)}>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" aria-label="Remover produto">
                        <Trash2 className="size-4" />
                      </Button>
                    </ConfirmDialog>
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
