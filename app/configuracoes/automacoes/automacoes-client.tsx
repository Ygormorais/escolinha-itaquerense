"use client"

import { useEffect, useState, useTransition } from "react"
import { AlertTriangle, CheckCircle2, Clock3, Play, RefreshCw, WandSparkles } from "lucide-react"
import { toast } from "sonner"
import {
  criarRegraAutomacao,
  definirAutomacaoAtiva,
  executarAutomacao,
  instalarRegrasPadrao,
  listarAutomacoesAdministrativas,
} from "@/app/actions/automacoes-administrativas"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Dados = NonNullable<Awaited<ReturnType<typeof listarAutomacoesAdministrativas>>["dados"]>

const rotulos: Record<string, string> = {
  documento_pendente: "Documentos sem aceite",
  mensalidade_vencida: "Mensalidades vencidas",
  renovacao_pendente: "Renovações pendentes",
  objetivo_vencendo: "Objetivos vencendo",
}

export function AutomacoesClient() {
  const [dados, setDados] = useState<Dados | null>(null)
  const [titulo, setTitulo] = useState("")
  const [tipo, setTipo] = useState("documento_pendente")
  const [dias, setDias] = useState(0)
  const [responsavelId, setResponsavelId] = useState("")
  const [pending, startTransition] = useTransition()

  async function recarregar() {
    const resultado = await listarAutomacoesAdministrativas()
    setDados(resultado.dados)
    if (!responsavelId && resultado.dados.usuarios[0]) setResponsavelId(String(resultado.dados.usuarios[0].id))
  }

  useEffect(() => {
    startTransition(async () => {
      try { await recarregar() } catch { toast.error("Não foi possível carregar as automações.") }
    })
    // A carga inicial deve ocorrer uma única vez; as demais são explícitas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function criar(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const resultado = await criarRegraAutomacao({ titulo, tipo, antecedenciaDias: dias, responsavelId: Number(responsavelId) })
      if ("error" in resultado) { toast.error(resultado.error); return }
      setTitulo("")
      await recarregar()
      toast.success("Regra criada.")
    })
  }

  function instalar() {
    startTransition(async () => {
      const resultado = await instalarRegrasPadrao()
      if ("error" in resultado) { toast.error(resultado.error); return }
      await recarregar()
      toast.success(resultado.criadas ? `${resultado.criadas} regra(s) instalada(s).` : "As regras recomendadas já estavam instaladas.")
    })
  }

  function executar(id: number) {
    startTransition(async () => {
      try {
        const resultado = await executarAutomacao(id)
        if ("error" in resultado) { toast.error(resultado.error); return }
        await recarregar()
        toast.success(`${resultado.criados} nova(s) pendência(s) criada(s) de ${resultado.encontrados} ocorrência(s).`)
      } catch {
        await recarregar()
        toast.error("A execução falhou. O erro foi registrado no histórico.")
      }
    })
  }

  function alternar(id: number, ativa: boolean) {
    startTransition(async () => {
      const resultado = await definirAutomacaoAtiva(id, ativa)
      if ("error" in resultado) { toast.error(resultado.error); return }
      await recarregar()
    })
  }

  if (!dados) {
    return <div className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">{pending ? "Carregando automações..." : "Não foi possível carregar."}</div>
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">Configuração inicial</p>
          <p className="text-sm text-muted-foreground">Instala as quatro regras locais recomendadas sem duplicar as existentes.</p>
        </div>
        <Button type="button" variant="outline" disabled={pending} onClick={instalar} className="w-full sm:w-auto">
          <WandSparkles className="size-4" /> Instalar regras recomendadas
        </Button>
      </div>

      <form onSubmit={criar} className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5"><Label htmlFor="automacao-titulo">Título</Label><Input id="automacao-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required minLength={3} /></div>
        <div className="space-y-1.5"><Label htmlFor="automacao-tipo">Tipo</Label><select id="automacao-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} className="h-11 w-full rounded-lg border bg-background px-3 text-sm">{Object.entries(rotulos).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}</select></div>
        <div className="space-y-1.5"><Label htmlFor="automacao-dias">Dias de antecedência/atraso</Label><Input id="automacao-dias" type="number" min={0} max={90} value={dias} onChange={(e) => setDias(Number(e.target.value))} /></div>
        <div className="space-y-1.5"><Label htmlFor="automacao-responsavel">Responsável interno</Label><select id="automacao-responsavel" value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)} className="h-11 w-full rounded-lg border bg-background px-3 text-sm">{dados.usuarios.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.nome} · {usuario.role}</option>)}</select></div>
        <Button type="submit" disabled={pending || !responsavelId} className="sm:col-span-2 lg:col-span-4 lg:w-fit">Criar regra personalizada</Button>
      </form>

      {dados.regras.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-10 text-center"><Clock3 className="mx-auto size-8 text-muted-foreground/40" /><p className="mt-3 font-semibold">Nenhuma regra configurada</p><p className="text-sm text-muted-foreground">Instale as regras recomendadas ou crie a primeira manualmente.</p></div>
      ) : (
        <div className="grid items-start gap-4 xl:grid-cols-2">
          {dados.regras.map((regra) => (
            <article key={regra.id} className="min-w-0 rounded-xl border bg-card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0"><h2 className="font-semibold">{regra.titulo}</h2><p className="text-xs text-muted-foreground">{rotulos[regra.tipo] ?? regra.tipo} · {regra.responsavel.nome} · {regra._count.execucoes} ocorrência(s)</p></div>
                <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${regra.ativa ? "bg-success-50 text-success-700" : "bg-muted text-muted-foreground"}`}>{regra.ativa ? "Ativa" : "Pausada"}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Última execução: {regra.ultimaExecucaoEm ? new Date(regra.ultimaExecucaoEm).toLocaleString("pt-BR") : "nunca"}</p>
              <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" disabled={pending || !regra.ativa} onClick={() => executar(regra.id)}><Play className="size-3.5" /> Executar</Button><Button size="sm" variant="outline" disabled={pending} onClick={() => alternar(regra.id, !regra.ativa)}>{regra.ativa ? "Pausar" : "Reativar"}</Button></div>

              <div className="mt-4 border-t pt-3">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Execuções recentes</p>
                {regra.ciclos.length === 0 ? <p className="mt-2 text-xs text-muted-foreground">Ainda não executada.</p> : <ul className="mt-2 space-y-2">{regra.ciclos.map((ciclo) => <li key={ciclo.id} className="flex min-w-0 items-start gap-2 text-xs">{ciclo.status === "sucesso" ? <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success-600" /> : <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-danger-600" />}<div className="min-w-0"><p className="font-medium">{new Date(ciclo.iniciadoEm).toLocaleString("pt-BR")} · {ciclo.status === "sucesso" ? `${ciclo.criados} criada(s) de ${ciclo.encontrados}` : "falhou"}</p>{ciclo.erro && <p className="break-words text-danger-600">{ciclo.erro}</p>}</div>{ciclo.status === "erro" && regra.ativa ? <Button size="sm" variant="ghost" className="ml-auto h-7 shrink-0 px-2" onClick={() => executar(regra.id)} aria-label={`Executar novamente ${regra.titulo}`}><RefreshCw className="size-3.5" /></Button> : null}</li>)}</ul>}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
