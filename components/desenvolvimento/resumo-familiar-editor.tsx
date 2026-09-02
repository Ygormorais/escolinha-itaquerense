"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { listarResumosFamiliares, prepararResumoFamiliar, salvarResumoFamiliar } from "@/app/actions/resumo-familiar"
import type { ResumoFamiliar, ResumoFamiliarSalvo } from "@/lib/resumo-familiar"
import { resumoEstaSalvo, resumoTemEdicoesPendentes } from "@/lib/resumo-edicoes"
import { useAvisoEdicoes } from "@/components/desenvolvimento/use-aviso-edicoes"
import { PublicacaoResumo } from "@/components/desenvolvimento/publicacao-resumo"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

export function ResumoFamiliarEditor({ alunoId, meses }: { alunoId: number; meses: { value: string; label: string }[] }) {
  const [open, setOpen] = useState(false)
  const [mes, setMes] = useState(meses[1]?.value ?? meses[0]?.value ?? "")
  const [resumo, setResumo] = useState<ResumoFamiliar | null>(null)
  const [texto, setTexto] = useState("")
  const [revisado, setRevisado] = useState(false)
  const [pending, startTransition] = useTransition()
  const [copiando, setCopiando] = useState(false)
  const [operacao, setOperacao] = useState("gerar")
  const [salvo, setSalvo] = useState<ResumoFamiliarSalvo | null>(null)
  const [historico, setHistorico] = useState<ResumoFamiliarSalvo[] | null>(null)
  const [proximaPagina, setProximaPagina] = useState<number | null>(null)
  const [substituir, setSubstituir] = useState(false)
  const [baseDesatualizada, setBaseDesatualizada] = useState(false)
  const [textoMantido, setTextoMantido] = useState(false)
  const versaoSalva = resumoEstaSalvo(resumo, texto, salvo)
  const edicoesPendentes = resumoTemEdicoesPendentes(resumo, texto, salvo)
  const outroMes = resumo !== null && resumo.mes !== mes
  useAvisoEdicoes(edicoesPendentes)
  const gerar = (manterTexto = false) => {
    if (pending || copiando || (manterTexto && (!resumo || outroMes)) || (edicoesPendentes && !substituir && !manterTexto)) return
    setOperacao("gerar")
    startTransition(async () => {
      try {
        const result = await prepararResumoFamiliar({ alunoId, mes })
        if (result.error || !result.resumo) { toast.error(result.error ?? "Não foi possível preparar o resumo."); return }
        setResumo(result.resumo)
        if (!manterTexto) setTexto(result.resumo.texto)
        setSalvo(null)
        setRevisado(false)
        setSubstituir(false)
        setBaseDesatualizada(false)
        setTextoMantido(manterTexto)
      } catch {
        toast.error("Não foi possível preparar o resumo. Verifique sua sessão e tente novamente.")
      }
    })
  }
  const salvar = () => {
    if (!resumo || outroMes || baseDesatualizada || !revisado || pending || copiando) return
    setOperacao("salvar")
    startTransition(async () => {
      try {
        const result = await salvarResumoFamiliar({ alunoId, mes: resumo.mes, texto, textoBase: resumo.texto, revisado })
        if (result.error || !result.salvo) {
          if ("desatualizado" in result && result.desatualizado) { setBaseDesatualizada(true); setRevisado(false) }
          toast.error(result.error ?? "Não foi possível salvar o resumo.")
          return
        }
        const versao = result.salvo
        setSalvo(versao)
        setTextoMantido(false)
        setHistorico((current) => current === null ? null : [versao, ...current.filter((item) => item.id !== versao.id)].sort((a, b) => b.id - a.id))
        toast.success("Versão revisada salva. Nenhuma mensagem foi enviada.")
      } catch {
        toast.error("Não foi possível confirmar o salvamento. Suas edições continuam aqui; tente novamente.")
      }
    })
  }
  const consultar = (antesDe?: number) => {
    setOperacao("listar")
    startTransition(async () => {
      try {
        const result = await listarResumosFamiliares({ alunoId, antesDe })
        if (result.error || !result.itens) { toast.error(result.error ?? "Não foi possível consultar o histórico."); return }
        const itens = result.itens
        setHistorico((current) => antesDe ? [...(current ?? []), ...itens.filter((item) => !current?.some((row) => row.id === item.id))] : itens)
        setProximaPagina(result.proximaPagina)
      } catch {
        toast.error("Não foi possível consultar os resumos salvos. Verifique sua sessão e tente novamente.")
      }
    })
  }
  const copiar = async (conteudo: string) => {
    setCopiando(true)
    try {
      await navigator.clipboard.writeText(conteudo)
      toast.success("Resumo copiado. Nenhuma mensagem foi enviada.")
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto e copie manualmente.")
    } finally { setCopiando(false) }
  }

  return <>
    <Button variant="outline" className="mt-4 w-full sm:w-auto" onClick={() => setOpen(true)}>Preparar resumo mensal para a família</Button>
    {!open && edicoesPendentes && <p role="status" className="mt-3 text-sm">Há alterações não salvas no resumo familiar. Abra novamente para retomar e salvar antes de sair desta página.</p>}
    <Dialog open={open} onOpenChange={(value) => { if (!pending && !copiando) setOpen(value) }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>Resumo mensal para a família</DialogTitle><DialogDescription>Rascunho local baseado em registros. Revise antes de compartilhar. Nada é publicado no portal ou enviado automaticamente.</DialogDescription></DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="family-summary-month">Mês do resumo</Label>
          <select id="family-summary-month" disabled={pending || copiando} value={mes} onChange={(event) => { setMes(event.target.value); setRevisado(false); setSubstituir(false) }} className="h-11 w-full rounded-[var(--radius-control)] border border-input bg-background px-3 text-sm">
            {meses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => gerar()} disabled={pending || copiando || resumo?.mes === mes || (edicoesPendentes && !substituir)}>{pending && operacao === "gerar" ? "Preparando..." : "Preparar rascunho"}</Button>
            {resumo && !outroMes && <Button variant="outline" disabled={pending || copiando} onClick={() => gerar(true)}>Atualizar base mantendo texto</Button>}
          </div>
          {outroMes && <p role="status" className="text-sm">O texto abaixo ainda pertence a {resumo.periodo}. Volte ao mês anterior para revisar, copiar ou salvar esse texto, ou prepare o mês selecionado.</p>}
          {outroMes && edicoesPendentes && <label className="flex min-h-11 items-start gap-3 text-sm"><input type="checkbox" checked={substituir} disabled={pending || copiando} onChange={(event) => setSubstituir(event.target.checked)} className="mt-1 size-4 shrink-0" />Permitir substituir minhas edições ao preparar outro resumo.</label>}
        </div>
        {pending && <p role="status" className="text-sm">{operacao === "salvar" ? "Salvando versão revisada..." : operacao === "listar" ? "Consultando versões salvas..." : "Consultando registros do mês..."}</p>}
        {baseDesatualizada && <p role="alert" className="text-sm text-destructive">Os registros do mês mudaram. Atualize a base, confira o texto e revise novamente antes de salvar. Suas edições foram preservadas.</p>}
        {textoMantido && <p role="status" className="text-sm">A base foi atualizada, mas o texto foi mantido. Confira e ajuste os dados no texto antes de confirmar novamente a revisão.</p>}
        {resumo && <div className="space-y-3">
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-semibold">Base do resumo: {resumo.periodo}{resumo.parcial ? " — dados parciais" : ""}</p>
            <ul className="mt-2 list-inside list-disc">{resumo.evidencias.map((item) => <li key={item}>{item}</li>)}</ul>
            <p className="mt-2 text-xs text-muted-foreground">A contagem de avaliações usa a data de cadastro, não o período avaliado. Observações internas, dados médicos e financeiros não são incluídos.</p>
          </div>
          <Label htmlFor="family-summary-text">Texto para revisão</Label>
          <Textarea id="family-summary-text" value={texto} disabled={pending || copiando} onChange={(event) => { setTexto(event.target.value); setRevisado(false); setSubstituir(false) }} rows={12} maxLength={4000} />
          {edicoesPendentes && <p role="status" className="text-sm">Alterações não salvas no resumo. Fechar esta janela mantém o texto nesta página, mas sair dela pode descartá-lo. O aviso de saída depende do navegador; salve antes de sair, especialmente no celular.</p>}
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={revisado} disabled={pending || copiando || outroMes || baseDesatualizada} onChange={(event) => setRevisado(event.target.checked)} className="mt-1 size-4 shrink-0" />Revisei o texto e os dados antes de compartilhar.</label>
          <p className="text-xs text-muted-foreground">{versaoSalva ? "Esta versão está salva para consulta da equipe." : "Edições ainda não salvas ficam apenas nesta tela. Recarregar a página descarta essas edições."} Salvar não publica o texto para a família.</p>
        </div>}
        <DialogFooter className="flex-wrap"><Button variant="outline" disabled={pending || copiando} onClick={() => setOpen(false)}>Fechar</Button><Button variant="outline" disabled={!resumo || !revisado || outroMes || baseDesatualizada || texto.trim().length < 30 || pending || copiando} onClick={() => copiar(texto)}>{copiando ? "Copiando..." : "Copiar resumo revisado"}</Button><Button disabled={!resumo || !revisado || outroMes || baseDesatualizada || texto.trim().length < 30 || pending || copiando || versaoSalva} onClick={salvar}>{versaoSalva ? "Versão salva" : "Salvar versão revisada"}</Button></DialogFooter>
        <section aria-labelledby="saved-family-summaries-title" className="space-y-3 border-t pt-4">
          <h3 id="saved-family-summaries-title" className="font-semibold">Versões salvas pela equipe</h3>
          <p className="text-xs text-muted-foreground">Cada versão preserva o texto revisado, autor e data. Os registros esportivos podem ter mudado desde então. Versões mais recentes primeiro.</p>
          <Button variant="outline" disabled={pending || copiando} onClick={() => consultar()}>{historico === null ? "Consultar versões salvas" : "Atualizar histórico"}</Button>
          {historico?.length === 0 && <p className="text-sm text-muted-foreground">Nenhum resumo salvo para este atleta.</p>}
          {historico?.map((item) => <details key={item.id} className="rounded-lg border p-3">
            <summary className="cursor-pointer text-sm font-medium break-words">{item.mes.split("-").reverse().join("/")} · {new Date(item.createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} · {item.usuario}</summary>
            <p className="my-3 whitespace-pre-wrap break-words text-sm">{item.texto}</p>
            <Button size="sm" variant="outline" disabled={pending || copiando} onClick={() => copiar(item.texto)}>Copiar esta versão</Button>
            <PublicacaoResumo resumoId={item.id} />
          </details>)}
          {proximaPagina !== null && <Button variant="outline" disabled={pending || copiando} onClick={() => consultar(proximaPagina)}>Carregar versões anteriores</Button>}
        </section>
      </DialogContent>
    </Dialog>
  </>
}
