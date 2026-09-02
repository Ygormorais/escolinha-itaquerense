"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { MAX_TEXTO_PAUTA, prepararPautaSemanal, type BasePautaSemanal, type PautaSemanalResumo, type PautaSemanalSalva } from "@/lib/pauta-semanal"
import { consultarPautaSemanal, listarPautasSemanais, salvarPautaSemanal } from "@/app/actions/pauta-semanal"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ComparacaoPautas } from "@/components/desenvolvimento/comparacao-pautas"
import { pautaEstaSalva, pautaTemEdicoesPendentes } from "@/lib/pauta-edicoes"
import { useAvisoEdicoes } from "@/components/desenvolvimento/use-aviso-edicoes"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function PautaSemanalEditor({ base }: { base: BasePautaSemanal }) {
  const [open, setOpen] = useState(false)
  const turmas = [...new Set(base.atletas.map((item) => item.turma))].sort((a, b) => a.localeCompare(b, "pt-BR"))
  const [turma, setTurma] = useState(turmas[0] ?? "")
  const [rascunho, setRascunho] = useState<{ texto: string; turma: string; cicloInicio: string; base: string } | null>(null)
  const [texto, setTexto] = useState("")
  const [revisado, setRevisado] = useState(false)
  const [substituir, setSubstituir] = useState(false)
  const [copiando, setCopiando] = useState(false)
  const [erro, setErro] = useState("")
  const [pending, startTransition] = useTransition()
  const [operacao, setOperacao] = useState("")
  const [salvo, setSalvo] = useState<PautaSemanalSalva | null>(null)
  const [historico, setHistorico] = useState<PautaSemanalResumo[] | null>(null)
  const [proximaPagina, setProximaPagina] = useState<number | null>(null)
  const [aberta, setAberta] = useState<PautaSemanalSalva | null>(null)
  const [turmasHistorico, setTurmasHistorico] = useState<string[] | null>(null)
  const [filtroTurma, setFiltroTurma] = useState<string | undefined>(undefined)
  const [filtroCiclo, setFiltroCiclo] = useState("")
  const limparResultados = () => {
    setHistorico(null)
    setProximaPagina(null)
    setAberta(null)
    setErro("")
  }
  const ocupado = pending || copiando
  const versaoBase = JSON.stringify(base)
  const desatualizado = rascunho !== null && rascunho.base !== versaoBase
  const editado = rascunho !== null && rascunho.texto !== texto
  const outraTurma = rascunho !== null && rascunho.turma !== turma
  const versaoSalva = pautaEstaSalva(rascunho, texto, salvo)
  const edicoesPendentes = pautaTemEdicoesPendentes(rascunho, texto, salvo)
  useAvisoEdicoes(edicoesPendentes)
  const preparar = () => {
    if (editado && !substituir) return
    try {
      const pauta = prepararPautaSemanal(base, turma)
      setTexto(pauta.texto)
      setRascunho({ texto: pauta.texto, turma, cicloInicio: pauta.cicloInicio, base: versaoBase })
      setSalvo(null)
      setRevisado(false)
      setSubstituir(false)
      setErro("")
    } catch (error) { setErro(error instanceof Error ? error.message : "Não foi possível preparar a pauta.") }
  }
  const copiar = async () => {
    if (!rascunho || !revisado || desatualizado || outraTurma || !texto.trim() || ocupado) return
    setCopiando(true)
    try {
      await navigator.clipboard.writeText(texto)
      toast.success("Pauta copiada. Nenhuma mensagem foi enviada.")
    } catch { toast.error("Não foi possível copiar. Selecione o texto e copie manualmente.") }
    finally { setCopiando(false) }
  }
  const salvar = () => {
    if (!rascunho || !revisado || desatualizado || outraTurma || ocupado) return
    setOperacao("Salvando versão revisada...")
    setErro("")
    startTransition(async () => {
      try {
        const result = await salvarPautaSemanal({ turma: rascunho.turma, cicloInicio: rascunho.cicloInicio, texto, textoBase: rascunho.texto, revisado })
        if (result.error || !result.salvo) { setErro(result.error ?? "Não foi possível salvar a pauta."); return }
        const versao = result.salvo
        setSalvo(versao)
        setTurmasHistorico((current) => current === null ? null : [...new Set([...current, versao.turma])].sort((a, b) => a.localeCompare(b, "pt-BR")))
        const corresponde = (filtroTurma === undefined || versao.turma === filtroTurma) && (!filtroCiclo || versao.cicloInicio === filtroCiclo)
        setHistorico((current) => current === null || !corresponde ? current : [versao, ...current.filter((item) => item.id !== versao.id)].sort((a, b) => b.id - a.id))
        toast.success("Pauta revisada salva. Nenhuma mensagem foi enviada.")
      } catch { setErro("Não foi possível confirmar o salvamento. Confira sua conexão e sessão; suas edições continuam aqui.") }
    })
  }
  const consultar = (antesDe?: number, filtros: { turma?: string; cicloInicio?: string } = { turma: filtroTurma, cicloInicio: filtroCiclo || undefined }) => {
    setOperacao("Consultando histórico...")
    setErro("")
    startTransition(async () => {
      try {
        const result = await listarPautasSemanais({ ...filtros, antesDe })
        if (result.error || !result.itens) { setErro(result.error ?? "Não foi possível consultar o histórico."); return }
        const itens = result.itens
        setHistorico((current) => antesDe ? [...(current ?? []), ...itens.filter((item) => !current?.some((row) => row.id === item.id))] : itens)
        setProximaPagina(result.proximaPagina)
        if (result.turmas) setTurmasHistorico(result.turmas)
        if (!antesDe) setAberta(null)
      } catch { setErro("Não foi possível consultar o histórico. Confira sua conexão e sessão.") }
    })
  }
  const abrirVersao = (id: number) => {
    setOperacao("Carregando versão salva...")
    setErro("")
    startTransition(async () => {
      try {
        const result = await consultarPautaSemanal(id)
        if (result.error || !result.pauta) { setErro(result.error ?? "Não foi possível carregar a pauta."); return }
        setAberta(result.pauta)
      } catch { setErro("Não foi possível carregar a pauta. Confira sua conexão e sessão.") }
    })
  }
  const copiarSalva = async (conteudo: string) => {
    setCopiando(true)
    try { await navigator.clipboard.writeText(conteudo); toast.success("Versão salva copiada. Nenhuma mensagem foi enviada.") }
    catch { toast.error("Não foi possível copiar. Selecione o texto e copie manualmente.") }
    finally { setCopiando(false) }
  }
  return <section aria-labelledby="weekly-agenda-title" className="rounded-[var(--radius-card)] border bg-card p-4 sm:p-5">
    <h2 id="weekly-agenda-title" className="font-heading text-xl font-bold">Pauta semanal da comissão</h2>
    <p className="mt-1 text-sm text-muted-foreground">Organize a reunião por turma com os indicadores e ações do ciclo. Preparação local, sem API de IA.</p>
    <Button variant="outline" className="mt-3 w-full sm:w-auto" onClick={() => setOpen(true)}>Preparar pauta por turma</Button>
    {!open && edicoesPendentes && <p role="status" className="mt-3 text-sm">Há alterações não salvas na pauta. Abra novamente para retomar e salvar antes de sair desta página.</p>}
    <Dialog open={open} onOpenChange={(value) => { if (!ocupado) setOpen(value) }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader><DialogTitle>Pauta semanal por turma</DialogTitle><DialogDescription>Uso interno da comissão. A preparação usa os dados já carregados, sem consultar IA. Salvar uma versão exige revisão e não envia mensagens.</DialogDescription></DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="weekly-agenda-class">Turma da pauta</Label>
          <select id="weekly-agenda-class" className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm" value={turma} disabled={ocupado || turmas.length === 0} onChange={(event) => { setTurma(event.target.value); setRevisado(false); setSubstituir(false); setErro("") }}>
            {turmas.length === 0 && <option value="">Nenhuma turma com atletas ativos</option>}
            {turmas.map((value) => <option key={value} value={value}>{value || "Sem turma"}</option>)}
          </select>
        </div>
        {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
        {pending && <p role="status" className="text-sm">{operacao}</p>}
        {desatualizado && <p role="alert" className="text-sm">Os dados do painel mudaram. Atualize a pauta e revise novamente antes de copiar. Suas edições foram preservadas.</p>}
        {outraTurma && <p role="status" className="text-sm">O texto abaixo ainda pertence à turma anterior. Prepare a pauta da turma selecionada antes de copiar.</p>}
        {rascunho && <div className="space-y-3">
          <Label htmlFor="weekly-agenda-text">Pauta para revisão</Label>
          <Textarea id="weekly-agenda-text" value={texto} disabled={ocupado} rows={16} maxLength={MAX_TEXTO_PAUTA} onChange={(event) => { setTexto(event.target.value); setRevisado(false); setSubstituir(false) }} />
          {edicoesPendentes && <p role="status" className="text-sm">Alterações não salvas. Fechar esta janela mantém o texto nesta página, mas sair dela pode descartá-lo. O aviso de saída depende do navegador; salve antes de sair, especialmente no celular.</p>}
          <label className="flex min-h-11 items-start gap-3 text-sm"><input className="mt-1 size-4 shrink-0" type="checkbox" checked={revisado} disabled={ocupado || desatualizado || outraTurma} onChange={(event) => setRevisado(event.target.checked)} />Revisei a pauta para uso interno da comissão.</label>
          {editado && <label className="flex min-h-11 items-start gap-3 text-sm"><input className="mt-1 size-4 shrink-0" type="checkbox" checked={substituir} disabled={ocupado} onChange={(event) => setSubstituir(event.target.checked)} />Permitir substituir minhas edições ao preparar outra pauta.</label>}
          <p className="text-xs text-muted-foreground">{versaoSalva ? "Esta versão está salva no histórico interno." : "Edições não salvas ficam apenas nesta tela; recarregar a página as descarta."} A pauta independe dos filtros da fila da semana. Pendências de outros ciclos continuam na consulta específica.</p>
        </div>}
        <DialogFooter className="flex-wrap">
          <Button variant="outline" disabled={ocupado} onClick={() => setOpen(false)}>Fechar</Button>
          <Button variant="outline" disabled={ocupado || turmas.length === 0 || (editado && !substituir)} onClick={preparar}>{rascunho ? "Atualizar pauta" : "Preparar pauta"}</Button>
          <Button variant="outline" disabled={!rascunho || !revisado || desatualizado || outraTurma || !texto.trim() || ocupado} onClick={copiar}>{copiando ? "Copiando..." : "Copiar pauta revisada"}</Button>
          <Button disabled={!rascunho || !revisado || desatualizado || outraTurma || texto.trim().length < 30 || texto.length > MAX_TEXTO_PAUTA || ocupado || versaoSalva} onClick={salvar}>{versaoSalva ? "Versão salva" : "Salvar pauta revisada"}</Button>
        </DialogFooter>
        <section aria-labelledby="saved-weekly-agendas-title" className="space-y-3 border-t pt-4">
          <h3 id="saved-weekly-agendas-title" className="font-semibold">Histórico de pautas revisadas</h3>
          <p className="text-xs text-muted-foreground">Todas as turmas, inclusive antigas, com versões mais recentes primeiro. Cada versão preserva o texto revisado, autor e data; os dados do painel podem ter mudado depois.</p>
          {turmasHistorico !== null && <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-2">
              <Label htmlFor="agenda-history-class">Turma no histórico</Label>
              <select id="agenda-history-class" value={filtroTurma === undefined ? "" : `t:${filtroTurma}`} disabled={ocupado} className="h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm" onChange={(event) => { setFiltroTurma(event.target.value === "" ? undefined : event.target.value.slice(2)); limparResultados() }}>
                <option value="">Todas as turmas</option>
                {[...new Set([...turmasHistorico, ...(filtroTurma === undefined ? [] : [filtroTurma])])].map((value) => <option key={value} value={`t:${value}`}>{value || "Sem turma"}</option>)}
              </select>
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <Label htmlFor="agenda-history-cycle">Ciclo no histórico</Label>
              <input id="agenda-history-cycle" type="date" value={filtroCiclo} disabled={ocupado} aria-describedby="agenda-history-cycle-help" className="h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm" onChange={(event) => { setFiltroCiclo(event.target.value); limparResultados() }} />
              <p id="agenda-history-cycle-help" className="text-xs text-muted-foreground">Segunda-feira de início do ciclo. Em branco, consulta todos os ciclos.</p>
            </div>
          </div>}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={ocupado} onClick={() => consultar()}>{historico === null ? turmasHistorico === null ? "Consultar pautas salvas" : "Aplicar filtros" : "Atualizar histórico de pautas"}</Button>
            {(filtroTurma !== undefined || filtroCiclo) && <Button variant="outline" disabled={ocupado} onClick={() => { setFiltroTurma(undefined); setFiltroCiclo(""); limparResultados(); consultar(undefined, {}) }}>Limpar filtros do histórico</Button>}
          </div>
          {historico === null && turmasHistorico !== null && !pending && <p role="status" className="text-sm text-muted-foreground">Aplique os filtros para consultar as pautas. Seu rascunho não foi alterado.</p>}
          {historico?.length === 0 && <p className="text-sm text-muted-foreground">{filtroTurma !== undefined || filtroCiclo ? "Nenhuma pauta encontrada para estes filtros." : "Nenhuma pauta salva pela equipe."}</p>}
          <ul className="space-y-3">{historico?.map((item) => <li key={item.id} className="min-w-0 rounded-lg border p-3 text-sm">
            <p className="break-words font-medium">{item.turma || "Sem turma"} · ciclo {item.cicloInicio.split("-").reverse().join("/")}</p>
            <p className="break-words text-xs text-muted-foreground">{item.usuario} · {new Date(item.createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>
            <Button className="mt-2" size="sm" variant="outline" disabled={ocupado} onClick={() => aberta?.id === item.id ? setAberta(null) : abrirVersao(item.id)} aria-expanded={aberta?.id === item.id}>{aberta?.id === item.id ? "Ocultar texto" : "Ver texto salvo"}</Button>
            {aberta?.id === item.id && <div className="mt-3 space-y-3"><p className="whitespace-pre-wrap break-words">{aberta.texto}</p><Button variant="outline" size="sm" disabled={ocupado} onClick={() => copiarSalva(aberta.texto)}>Copiar versão salva</Button></div>}
          </li>)}</ul>
          {proximaPagina !== null && <Button variant="outline" disabled={ocupado} onClick={() => consultar(proximaPagina)}>Carregar pautas anteriores</Button>}
          {historico !== null && historico.length > 0 && <ComparacaoPautas historico={historico} disabled={ocupado} />}
        </section>
      </DialogContent>
    </Dialog>
  </section>
}
