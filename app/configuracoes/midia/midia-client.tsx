"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import Image from "next/image"
import { Film, Image as ImageIcon, Trash2, Plus, Play, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
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
import { adicionarMidia, removerMidia } from "@/app/actions/midia"
import { extractYoutubeId, getYoutubeThumbnail } from "@/lib/youtube"
import { VideoModal } from "@/components/responsavel/video-modal"

type Midia = {
  id: number
  tipo: string
  titulo: string
  url: string
  partidaId: number | null
  campeonatoId: number | null
  createdAt: Date
  partida: {
    id: number
    campeonatoId: number
    rodada: number
    data: Date
    adversario: string
    local: string
    golsPro: number | null
    golsContra: number | null
    resultado: string | null
    observacoes: string | null
    createdAt: Date
  } | null
  campeonato: {
    id: number
    nome: string
    descricao: string | null
    dataInicio: Date
    dataFim: Date | null
    local: string | null
    taxaInscricao: number
    taxaJogo: number
    taxaArbitragem: number
    custoTransporte: number
    custoUniforme: number
    observacoes: string | null
    status: string
    createdAt: Date
  } | null
}

type Partida = {
  id: number
  adversario: string
  data: Date
  golsPro: number | null
  golsContra: number | null
  campeonato: { nome: string }
}

type Campeonato = { id: number; nome: string }

function formatPartidaLabel(p: Partida) {
  const resultado = p.golsPro != null && p.golsContra != null
    ? ` ${p.golsPro}×${p.golsContra}`
    : ""
  const data = new Date(p.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
  return `${p.adversario}${resultado} — ${data}`
}

function formatVinculo(m: Midia) {
  if (m.partida) {
    const resultado = m.partida.golsPro != null && m.partida.golsContra != null
      ? ` ${m.partida.golsPro}×${m.partida.golsContra}`
      : ""
    const data = new Date(m.partida.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    return `${m.partida.adversario}${resultado} — ${data}`
  }
  if (m.campeonato) return `🏆 ${m.campeonato.nome}`
  return "—"
}

export function MidiaClient({
  midias,
  partidas,
  campeonatos,
}: {
  midias: Midia[]
  partidas: Partida[]
  campeonatos: Campeonato[]
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startPending] = useTransition()
  const [videoPlayer, setVideoPlayer] = useState<string | null>(null)
  const [form, setForm] = useState({
    tipo: "video" as "video" | "fotos",
    titulo: "",
    url: "",
    vinculo: "" as "partida" | "campeonato" | "",
    partidaId: "",
    campeonatoId: "",
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startPending(async () => {
      try {
        const result = await adicionarMidia({
          tipo: form.tipo,
          titulo: form.titulo,
          url: form.url,
          partidaId: form.vinculo === "partida" && form.partidaId ? Number(form.partidaId) : undefined,
          campeonatoId: form.vinculo === "campeonato" && form.campeonatoId ? Number(form.campeonatoId) : undefined,
        })
        if (result && "error" in result) { toast.error(result.error); return }
        toast.success("Mídia adicionada!")
        setOpen(false)
        setForm({ tipo: "video", titulo: "", url: "", vinculo: "", partidaId: "", campeonatoId: "" })
      } catch {
        toast.error("Erro ao adicionar mídia")
      }
    })
  }

  async function handleRemover(id: number) {
    const result = await removerMidia(id)
    if (result && "error" in result) { toast.error(result.error); return }
    toast.success("Mídia removida!")
  }

  return (
    <div className="p-8 space-y-6">
      <PageHeader
        title="Mídia"
        description="Fotos e vídeos das partidas e do clube"
        action={
        <Dialog open={open} onOpenChange={setOpen}>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="size-4 mr-1" /> Nova Mídia
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Mídia</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: (v ?? "video") as "video" | "fotos" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">▶ Vídeo</SelectItem>
                    <SelectItem value="fotos">📷 Fotos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="midia-titulo">Título</Label>
                <Input
                  id="midia-titulo"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ex: Melhores momentos, Gol do João..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="midia-url">URL</Label>
                <Input
                  id="midia-url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://youtube.com/... ou https://photos.google.com/..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Vincular a</Label>
                <Select value={form.vinculo} onValueChange={(v) => setForm({ ...form, vinculo: (v ?? "") as "partida" | "campeonato" | "", partidaId: "", campeonatoId: "" })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="partida">Partida</SelectItem>
                    <SelectItem value="campeonato">Campeonato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.vinculo === "partida" && (
                <div className="space-y-2">
                  <Label>Partida</Label>
                  <Select value={form.partidaId} onValueChange={(v) => setForm({ ...form, partidaId: v ?? "" })}>
                    <SelectTrigger><SelectValue placeholder="Selecione a partida..." /></SelectTrigger>
                    <SelectContent>
                      {partidas.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>{formatPartidaLabel(p)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {form.vinculo === "campeonato" && (
                <div className="space-y-2">
                  <Label>Campeonato</Label>
                  <Select value={form.campeonatoId} onValueChange={(v) => setForm({ ...form, campeonatoId: v ?? "" })}>
                    <SelectTrigger><SelectValue placeholder="Selecione o campeonato..." /></SelectTrigger>
                    <SelectContent>
                      {campeonatos.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? <><Loader2 className="size-4 animate-spin" /> Adicionando...</> : "Adicionar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        }
      />

      {midias.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma mídia cadastrada.</p>
      ) : (
        <>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Prévia</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Vinculado a</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {midias.map((m) => {
              const youtubeId = m.tipo === "video" ? extractYoutubeId(m.url) : null
              return (
                <TableRow key={m.id}>
                  <TableCell>
                    {youtubeId ? (
                      <button
                        onClick={() => setVideoPlayer(youtubeId)}
                        aria-label={`Reproduzir vídeo: ${m.titulo}`}
                        className="group relative block size-16 shrink-0 overflow-hidden rounded-md bg-muted"
                      >
                        <Image
                          src={getYoutubeThumbnail(youtubeId)}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                          <Play className="size-6 text-white" />
                        </div>
                      </button>
                    ) : (
                      <div className="flex size-16 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <ImageIcon className="size-6" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {m.tipo === "video"
                      ? <Badge variant="secondary" className="gap-1"><Film className="size-3" />Vídeo</Badge>
                      : <Badge variant="secondary" className="gap-1"><ImageIcon className="size-3" />Fotos</Badge>
                    }
                  </TableCell>
                  <TableCell className="font-medium">{m.titulo}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                    <a href={m.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{m.url}</a>
                  </TableCell>
                  <TableCell className="text-sm">{formatVinculo(m)}</TableCell>
                  <TableCell>
                    <ConfirmDialog title="Remover mídia?" description="Esta ação não pode ser desfeita." confirmLabel="Remover" onConfirm={() => handleRemover(m.id)}>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" aria-label="Remover mídia">
                        <Trash2 className="size-4" />
                      </Button>
                    </ConfirmDialog>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {videoPlayer && (
          <VideoModal
            videoId={videoPlayer}
            titulo=""
            onClose={() => setVideoPlayer(null)}
          />
        )}
        </>
      )}
    </div>
  )
}
