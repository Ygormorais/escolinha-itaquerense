"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Newspaper, Plus, Pencil, Trash2, Eye, EyeOff, Star, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { criarNoticia, editarNoticia, deletarNoticia, togglePublicado } from "@/app/actions/noticias"
import type { RscDate } from "@/lib/rsc-date"

type Noticia = {
  id: number
  titulo: string
  subtitulo: string | null
  categoria: string
  imagemUrl: string | null
  publicado: boolean
  destaque: boolean
  createdAt: RscDate
}

const CATEGORIAS = ["Notícia", "Resultado", "Convocação", "Evento", "Comunicado", "Conquista"]

const BLANK = {
  titulo: "", subtitulo: "", categoria: "Notícia",
  imagemUrl: "", publicado: true, destaque: false,
}

export function NoticiasClient({ noticias }: { noticias: Noticia[] }) {
  const router = useRouter()
  const [creating, startCreating] = useTransition()
  const [saving, startSaving] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Noticia | null>(null)
  const [form, setForm] = useState(BLANK)

  const publicadas = noticias.filter((n) => n.publicado).length
  const destaques = noticias.filter((n) => n.destaque).length

  function openCreate() { setForm(BLANK); setEditTarget(null); setDialogOpen(true) }
  function openEdit(n: Noticia) {
    setForm({
      titulo: n.titulo, subtitulo: n.subtitulo ?? "",
      categoria: n.categoria, imagemUrl: n.imagemUrl ?? "",
      publicado: n.publicado, destaque: n.destaque,
    })
    setEditTarget(n)
    setDialogOpen(true)
  }

  function handleSave() {
    if (!form.titulo.trim()) { toast.error("Título obrigatório"); return }
    const data = {
      titulo: form.titulo,
      subtitulo: form.subtitulo || undefined,
      categoria: form.categoria,
      imagemUrl: form.imagemUrl || undefined,
      publicado: form.publicado,
      destaque: form.destaque,
    }
    if (editTarget) {
      startSaving(async () => {
        try { await editarNoticia(editTarget.id, data); toast.success("Notícia atualizada!"); setDialogOpen(false); router.refresh() }
        catch { toast.error("Erro ao salvar") }
      })
    } else {
      startCreating(async () => {
        try { await criarNoticia(data); toast.success("Notícia criada!"); setDialogOpen(false); router.refresh() }
        catch { toast.error("Erro ao criar") }
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold font-heading">{noticias.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Publicadas</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold font-heading text-success-600">{publicadas}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Star className="size-3.5" />Destaques</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold font-heading text-warning-600">{destaques}</p></CardContent></Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={openCreate}><Plus className="size-4" /> Nova Notícia</Button>
      </div>

      {noticias.length === 0 && (
        <EmptyState icon={Newspaper} title="Nenhuma notícia cadastrada" description="Crie a primeira publicação do clube." />
      )}

      <div className="grid gap-3">
        {noticias.map((n) => (
          <Card key={n.id} className="flex flex-row items-center gap-4 px-5 py-4">
            {/* Categoria color bar */}
            <div className="w-1 self-stretch rounded-full bg-brand-600 flex-shrink-0" />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Badge variant="outline" className="text-xs">{n.categoria}</Badge>
                {n.destaque && <Badge variant="secondary" className="text-xs text-warning-600"><Star className="size-2.5 mr-0.5" />Destaque</Badge>}
                {!n.publicado && <Badge variant="outline" className="text-xs text-muted-foreground">Rascunho</Badge>}
              </div>
              <p className="font-semibold text-sm truncate">{n.titulo}</p>
              {n.subtitulo && <p className="text-xs text-muted-foreground truncate">{n.subtitulo}</p>}
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(new Date(n.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                size="icon-sm" variant="ghost"
                title={n.publicado ? "Despublicar" : "Publicar"}
                onClick={async () => {
                  await togglePublicado(n.id, !n.publicado)
                  toast.success(n.publicado ? "Despublicada" : "Publicada!")
                  router.refresh()
                }}
              >
                {n.publicado ? <Eye className="size-4 text-success-600" /> : <EyeOff className="size-4 text-muted-foreground" />}
              </Button>
              <Button size="icon-sm" variant="ghost" onClick={() => openEdit(n)}>
                <Pencil className="size-4" />
              </Button>
              <ConfirmDialog title="Deletar notícia?" description={`Remover "${n.titulo}"?`} confirmLabel="Deletar" onConfirm={async () => { await deletarNoticia(n.id); toast.success("Removida"); router.refresh() }}>
                <Button size="icon-sm" variant="ghost">
                  <Trash2 className="size-4 text-danger-600" />
                </Button>
              </ConfirmDialog>
            </div>
          </Card>
        ))}
      </div>

      {/* Dialog criar/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Newspaper className="size-4" />
              {editTarget ? "Editar Notícia" : "Nova Notícia"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Título da notícia" />
            </div>
            <div className="space-y-2">
              <Label>Subtítulo</Label>
              <Textarea value={form.subtitulo} onChange={(e) => setForm({ ...form, subtitulo: e.target.value })} placeholder="Texto de apoio (aparece abaixo do título no carrossel)" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={(v) => { if (v) setForm({ ...form, categoria: v }) }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>URL da Imagem</Label>
                <Input value={form.imagemUrl} onChange={(e) => setForm({ ...form, imagemUrl: e.target.value })} placeholder="https://..." />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3 gap-4">
              <div>
                <p className="text-sm font-medium">Publicar</p>
                <p className="text-xs text-muted-foreground">Aparece na landing page</p>
              </div>
              <Switch checked={form.publicado} onCheckedChange={(v) => setForm({ ...form, publicado: v })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3 gap-4">
              <div>
                <p className="text-sm font-medium flex items-center gap-1.5"><Star className="size-3.5 text-warning-500" /> Destaque</p>
                <p className="text-xs text-muted-foreground">Aparece primeiro no carrossel</p>
              </div>
              <Switch checked={form.destaque} onCheckedChange={(v) => setForm({ ...form, destaque: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={creating || saving}>
              {(creating || saving) ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
