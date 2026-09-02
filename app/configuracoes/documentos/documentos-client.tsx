"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { criarDocumento, definirDocumentoAtivo, publicarVersao } from "@/app/actions/documentos"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Documento = { id: number; titulo: string; categoria: string; ativo: boolean; versoes: { id: number; versao: string; conteudo: string; url: string | null; turmas: string; obrigatorio: boolean; publicadoEm: Date | string; criadoPor: string; _count: { aceites: number } }[] }
const vazio = { titulo: "", categoria: "Termo", versao: "1.0", conteudo: "", url: "", turmas: "Todas", obrigatorio: true }

export function DocumentosAdminClient({ documentos }: { documentos: Documento[] }) {
  const [form, setForm] = useState(vazio)
  const [novaVersaoDe, setNovaVersaoDe] = useState<number | null>(null)
  const [pending, startTransition] = useTransition()
  const campo = (nome: keyof typeof form, valor: string | boolean) => setForm((atual) => ({ ...atual, [nome]: valor }))

  function salvar(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const payload = { versao: form.versao, conteudo: form.conteudo, url: form.url, turmas: form.turmas, obrigatorio: form.obrigatorio }
      const resultado = novaVersaoDe == null ? await criarDocumento({ ...payload, titulo: form.titulo, categoria: form.categoria }) : await publicarVersao(novaVersaoDe, payload)
      if ("error" in resultado) { toast.error(resultado.error); return }
      toast.success(novaVersaoDe == null ? "Documento publicado." : "Nova versão publicada.")
      setForm(vazio); setNovaVersaoDe(null)
    })
  }

  function alternar(id: number, ativo: boolean) {
    startTransition(async () => {
      const resultado = await definirDocumentoAtivo(id, ativo)
      if ("error" in resultado) toast.error(resultado.error)
      else toast.success(ativo ? "Documento reativado." : "Documento arquivado.")
    })
  }

  return <div className="grid items-start gap-6 xl:grid-cols-[minmax(20rem,26rem)_minmax(0,1fr)]"><form onSubmit={salvar} className="space-y-4 rounded-xl border bg-card p-4 xl:sticky xl:top-4"><div><h2 className="font-heading text-lg font-bold">{novaVersaoDe == null ? "Novo documento" : "Publicar nova versão"}</h2><p className="text-xs text-muted-foreground">Versões publicadas não são editadas; uma correção gera uma nova versão.</p></div>{novaVersaoDe == null && <><div className="space-y-2"><Label htmlFor="doc-titulo">Título</Label><Input id="doc-titulo" value={form.titulo} onChange={(e) => campo("titulo", e.target.value)} required /></div><div className="space-y-2"><Label htmlFor="doc-categoria">Categoria</Label><Input id="doc-categoria" value={form.categoria} onChange={(e) => campo("categoria", e.target.value)} required /></div></>}<div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label htmlFor="doc-versao">Versão</Label><Input id="doc-versao" value={form.versao} onChange={(e) => campo("versao", e.target.value)} required /></div><div className="space-y-2"><Label htmlFor="doc-turmas">Turmas</Label><Input id="doc-turmas" value={form.turmas} onChange={(e) => campo("turmas", e.target.value)} placeholder="Todas ou Sub-9, Sub-11" required /></div></div><div className="space-y-2"><Label htmlFor="doc-conteudo">Conteúdo apresentado à família</Label><Textarea id="doc-conteudo" value={form.conteudo} onChange={(e) => campo("conteudo", e.target.value)} minLength={20} maxLength={12000} rows={9} required /></div><div className="space-y-2"><Label htmlFor="doc-url">Arquivo ou página complementar (opcional)</Label><Input id="doc-url" value={form.url} onChange={(e) => campo("url", e.target.value)} placeholder="https://... ou /termos" /></div><label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={form.obrigatorio} onChange={(e) => campo("obrigatorio", e.target.checked)} className="size-4" />Exigir aceite explícito</label><div className="flex gap-2"><Button type="submit" disabled={pending}>{pending ? "Publicando..." : "Publicar"}</Button>{novaVersaoDe != null && <Button type="button" variant="outline" onClick={() => { setNovaVersaoDe(null); setForm(vazio) }}>Cancelar</Button>}</div></form><section className="space-y-4" aria-label="Documentos publicados">{documentos.length === 0 ? <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhum documento publicado.</p> : documentos.map((doc) => <article key={doc.id} className="rounded-xl border bg-card p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-heading text-lg font-bold">{doc.titulo}</h2><p className="text-xs text-muted-foreground">{doc.categoria} · {doc.ativo ? "Ativo" : "Arquivado"}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => { const ultima = doc.versoes[0]; setNovaVersaoDe(doc.id); setForm({ ...vazio, titulo: doc.titulo, categoria: doc.categoria, versao: "", turmas: ultima?.turmas ?? "Todas", obrigatorio: ultima?.obrigatorio ?? true }) }}>Nova versão</Button><Button size="sm" variant="ghost" disabled={pending} onClick={() => alternar(doc.id, !doc.ativo)}>{doc.ativo ? "Arquivar" : "Reativar"}</Button></div></div><div className="mt-4 space-y-2">{doc.versoes.map((versao, indice) => <details key={versao.id} className="rounded-lg border p-3" open={indice === 0}><summary className="cursor-pointer text-sm font-semibold">Versão {versao.versao} · {new Date(versao.publicadoEm).toLocaleDateString("pt-BR")} · {versao._count.aceites} aceite(s)</summary><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{versao.conteudo}</p><p className="mt-2 text-xs text-muted-foreground">Turmas: {versao.turmas} · {versao.obrigatorio ? "Aceite obrigatório" : "Leitura informativa"} · por {versao.criadoPor}</p></details>)}</div></article>)}</section></div>
}
