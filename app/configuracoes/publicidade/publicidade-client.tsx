"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { ExternalLink, Loader2, Megaphone, Pause, Pencil, Play, Plus, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { EmptyState } from "@/components/ui/empty-state"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { alternarAnuncio, removerAnuncio, salvarAnuncio } from "@/app/actions/anuncios"
import { FUSO_CLUBE, POSICOES_ANUNCIO, diaNoClube, statusAnuncio, type PosicaoAnuncio } from "@/lib/site/anuncios"

export interface AnuncioLinha {
  id: number
  anunciante: string
  titulo: string
  imagemUrl: string
  imagemMobileUrl: string | null
  link: string
  posicao: string
  ativo: boolean
  inicio: string | null
  fim: string | null
  cliques: number
}

const STATUS = {
  "no-ar": { rotulo: "No ar", variante: "default" as const },
  agendado: { rotulo: "Agendado", variante: "secondary" as const },
  encerrado: { rotulo: "Encerrado", variante: "outline" as const },
  pausado: { rotulo: "Pausado", variante: "outline" as const },
}

const vazio = {
  anunciante: "",
  titulo: "",
  imagemUrl: "",
  imagemMobileUrl: "",
  link: "",
  posicao: "landing" as PosicaoAnuncio,
  ativo: true,
  inicio: "",
  fim: "",
}

/** Instante gravado → "2026-11-30" no calendário do clube, para o input type=date. */
function paraInputData(iso: string | null): string {
  return iso ? diaNoClube(new Date(iso)) : ""
}

function periodo(a: AnuncioLinha): string {
  const f = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: FUSO_CLUBE })
  if (a.inicio && a.fim) return `${f(a.inicio)} a ${f(a.fim)}`
  if (a.inicio) return `A partir de ${f(a.inicio)}`
  if (a.fim) return `Até ${f(a.fim)}`
  return "Sem prazo"
}

async function enviarImagem(arquivo: File): Promise<string> {
  const dados = new FormData()
  dados.append("arquivo", arquivo)
  const r = await fetch("/api/upload/publicidade", { method: "POST", body: dados })
  const up = (await r.json()) as { url?: string; error?: string }
  if (!r.ok || !up.url) throw new Error(up.error ?? "Erro ao enviar a imagem")
  return up.url
}

export function PublicidadeClient({ anuncios }: { anuncios: AnuncioLinha[] }) {
  const [aberto, setAberto] = useState(false)
  const [editando, setEditando] = useState<number | null>(null)
  const [form, setForm] = useState(vazio)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [arquivoMobile, setArquivoMobile] = useState<File | null>(null)
  const [salvando, startSalvar] = useTransition()
  const agora = new Date()

  function abrirNovo() {
    setEditando(null)
    setForm(vazio)
    setArquivo(null)
    setArquivoMobile(null)
    setAberto(true)
  }

  function abrirEdicao(a: AnuncioLinha) {
    setEditando(a.id)
    setForm({
      anunciante: a.anunciante,
      titulo: a.titulo,
      imagemUrl: a.imagemUrl,
      imagemMobileUrl: a.imagemMobileUrl ?? "",
      link: a.link,
      posicao: (a.posicao in POSICOES_ANUNCIO ? a.posicao : "landing") as PosicaoAnuncio,
      ativo: a.ativo,
      inicio: paraInputData(a.inicio),
      fim: paraInputData(a.fim),
    })
    setArquivo(null)
    setArquivoMobile(null)
    setAberto(true)
  }

  function salvar(e: React.FormEvent) {
    e.preventDefault()
    startSalvar(async () => {
      try {
        const imagemUrl = arquivo ? await enviarImagem(arquivo) : form.imagemUrl
        const imagemMobileUrl = arquivoMobile ? await enviarImagem(arquivoMobile) : form.imagemMobileUrl
        if (!imagemUrl) {
          toast.error("Envie a imagem do banner")
          return
        }
        const r = await salvarAnuncio(editando, { ...form, imagemUrl, imagemMobileUrl })
        if ("error" in r) {
          toast.error(r.error)
          return
        }
        toast.success(editando ? "Anúncio atualizado" : "Anúncio criado")
        setAberto(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao salvar anúncio")
      }
    })
  }

  async function alternar(a: AnuncioLinha) {
    const r = await alternarAnuncio(a.id, !a.ativo)
    if ("error" in r) toast.error(r.error)
    else toast.success(a.ativo ? "Anúncio pausado" : "Anúncio ativado")
  }

  async function remover(id: number) {
    const r = await removerAnuncio(id)
    if ("error" in r) toast.error(r.error)
    else toast.success("Anúncio removido")
  }

  return (
    <div className="space-y-6 bg-[var(--color-paper-50)]/40 p-6 lg:p-8 dark:bg-transparent">
      <PageHeader
        title="Publicidade"
        description="Banners de patrocinadores e da loja do clube no site público. Cada clique é contado."
        action={
          <Button size="sm" onClick={abrirNovo}>
            <Plus className="mr-1 size-4" /> Novo anúncio
          </Button>
        }
      />

      {anuncios.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Nenhum anúncio cadastrado"
          description="Cadastre o banner de um patrocinador para ele aparecer na página inicial ou na página de partidas."
          action={{ label: "Novo anúncio", onClick: abrirNovo }}
        />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {anuncios.map((a) => {
            const st = STATUS[statusAnuncio({ ativo: a.ativo, inicio: a.inicio ? new Date(a.inicio) : null, fim: a.fim ? new Date(a.fim) : null }, agora)]
            return (
              <li key={a.id} className="overflow-hidden rounded-xl border bg-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.imagemUrl} alt={a.titulo} className="aspect-[6/1] w-full bg-muted object-cover" />
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{a.anunciante}</h3>
                      <p className="truncate text-sm text-muted-foreground">{a.titulo}</p>
                    </div>
                    <Badge variant={st.variante}>{st.rotulo}</Badge>
                  </div>
                  <dl className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">Onde</dt>
                      <dd>{a.posicao === "partidas" ? "Partidas" : "Página inicial"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Período</dt>
                      <dd>{periodo(a)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Cliques</dt>
                      <dd data-numeric className="font-semibold">{a.cliques}</dd>
                    </div>
                  </dl>
                  <div className="flex items-center justify-between border-t pt-3">
                    <a href={a.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-brand-800 hover:underline dark:text-brand-200">
                      Abrir link <ExternalLink className="size-3.5" aria-hidden />
                    </a>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => alternar(a)} aria-label={a.ativo ? `Pausar anúncio de ${a.anunciante}` : `Ativar anúncio de ${a.anunciante}`}>
                        {a.ativo ? <Pause className="size-4" /> : <Play className="size-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => abrirEdicao(a)} aria-label={`Editar anúncio de ${a.anunciante}`}>
                        <Pencil className="size-4" />
                      </Button>
                      <ConfirmDialog title="Remover anúncio?" description="O banner sai do site e a contagem de cliques é apagada." confirmLabel="Remover" onConfirm={() => remover(a.id)}>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" aria-label={`Remover anúncio de ${a.anunciante}`}>
                          <Trash2 className="size-4" />
                        </Button>
                      </ConfirmDialog>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar anúncio" : "Novo anúncio"}</DialogTitle>
            <DialogDescription>O banner aparece com o rótulo &quot;Publicidade&quot; e abre o link em nova aba.</DialogDescription>
          </DialogHeader>
          <form onSubmit={salvar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="an-anunciante">Anunciante</Label>
              <Input id="an-anunciante" value={form.anunciante} onChange={(e) => setForm({ ...form, anunciante: e.target.value })} placeholder="Ex.: Padaria do Bairro" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="an-titulo">Descrição do banner</Label>
              <Input id="an-titulo" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ex.: Pão quentinho todo dia, na rua do clube" required />
              <p className="text-xs text-muted-foreground">Lida por leitores de tela no lugar da imagem.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="an-link">Link</Label>
              <Input id="an-link" type="url" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="an-imagem">Imagem do banner</Label>
              <Input id="an-imagem" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} required={!form.imagemUrl} />
              <p className="text-xs text-muted-foreground">
                Formato largo, ideal 1200 × 200 px. JPG, PNG ou WebP até 5 MB.{form.imagemUrl && !arquivo ? " Deixe em branco para manter a atual." : ""}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="an-imagem-mobile">Imagem para celular (opcional)</Label>
              <Input id="an-imagem-mobile" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setArquivoMobile(e.target.files?.[0] ?? null)} />
              <p className="text-xs text-muted-foreground">Ideal 640 × 200 px. Sem ela, o celular mostra a imagem principal.</p>
            </div>
            <div className="space-y-2">
              <Label>Onde aparece</Label>
              <Select value={form.posicao} onValueChange={(v) => setForm({ ...form, posicao: (v ?? "landing") as PosicaoAnuncio })}>
                <SelectTrigger aria-label="Onde aparece" className="w-full">
                  <SelectValue>{(v: string) => POSICOES_ANUNCIO[v as PosicaoAnuncio] ?? v}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(POSICOES_ANUNCIO) as [PosicaoAnuncio, string][]).map(([valor, rotulo]) => (
                    <SelectItem key={valor} value={valor}>{rotulo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="an-inicio">Início (opcional)</Label>
                <Input id="an-inicio" type="date" value={form.inicio} onChange={(e) => setForm({ ...form, inicio: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="an-fim">Fim (opcional)</Label>
                <Input id="an-fim" type="date" value={form.fim} onChange={(e) => setForm({ ...form, fim: e.target.value })} />
              </div>
            </div>
            <label className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <span className="text-sm font-medium">Ativo</span>
              <Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} />
            </label>
            <Button type="submit" className="w-full" disabled={salvando}>
              {salvando ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : editando ? "Salvar alterações" : "Criar anúncio"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
