"use client"

import { useState, useTransition } from "react"
import { consultarPautaSemanal } from "@/app/actions/pauta-semanal"
import { compararPautas } from "@/lib/comparacao-pautas"
import type { PautaSemanalResumo } from "@/lib/pauta-semanal"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

const identificar = (pauta: PautaSemanalResumo) => `#${pauta.id} · ${pauta.turma || "Sem turma"} · ciclo ${pauta.cicloInicio.split("-").reverse().join("/")} · ${pauta.usuario}`

export function ComparacaoPautas({ historico, disabled }: { historico: PautaSemanalResumo[]; disabled: boolean }) {
  const [primeira, setPrimeira] = useState("")
  const [segunda, setSegunda] = useState("")
  const [resultado, setResultado] = useState<ReturnType<typeof compararPautas> | null>(null)
  const [erro, setErro] = useState("")
  const [pending, startTransition] = useTransition()
  const a = historico.find((item) => String(item.id) === primeira)
  const b = historico.find((item) => String(item.id) === segunda)
  const valido = a && b && a.id !== b.id && a.turma === b.turma
  const comparar = () => {
    if (!valido || disabled || pending) return
    setErro("")
    setResultado(null)
    startTransition(async () => {
      try {
        const [origem, destino] = await Promise.all([consultarPautaSemanal(a.id), consultarPautaSemanal(b.id)])
        if (!origem.pauta || !destino.pauta) {
          setErro(origem.error ?? destino.error ?? "Não foi possível consultar as versões.")
          return
        }
        setResultado(compararPautas(origem.pauta, destino.pauta))
      } catch { setErro("Não foi possível comparar. Confira sua conexão e sessão e tente novamente.") }
    })
  }
  return <section aria-labelledby="agenda-comparison-title" className="min-w-0 space-y-3 rounded-lg border p-3">
    <h4 id="agenda-comparison-title" className="font-semibold">Comparar pautas salvas</h4>
    <p className="text-xs text-muted-foreground">Selecione duas versões da mesma turma entre as pautas carregadas. Carregue pautas anteriores para ampliar a seleção. A comparação é textual e local; não avalia evolução dos atletas nem altera o rascunho.</p>
    <div className="grid min-w-0 gap-3 sm:grid-cols-2">
      {[{ id: "agenda-compare-first", label: "Primeira versão", value: primeira, set: setPrimeira }, { id: "agenda-compare-second", label: "Segunda versão", value: segunda, set: setSegunda }].map((campo) => <div key={campo.id} className="flex min-w-0 flex-col gap-2">
        <Label htmlFor={campo.id}>{campo.label}</Label>
        <select id={campo.id} value={campo.value} disabled={disabled || pending} className="h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm" onChange={(event) => { campo.set(event.target.value); setResultado(null); setErro("") }}>
          <option value="">Selecione uma versão</option>
          {historico.map((item) => <option key={item.id} value={item.id}>{identificar(item)}</option>)}
        </select>
      </div>)}
    </div>
    {a && b && !valido && <p role="status" className="text-sm">Escolha duas versões diferentes da mesma turma.</p>}
    <Button variant="outline" disabled={!valido || disabled || pending} onClick={comparar}>{pending ? "Comparando..." : "Comparar versões"}</Button>
    {pending && <p role="status" className="text-sm">Carregando os textos salvos para comparação local...</p>}
    {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
    {resultado && valido && <div className="space-y-3" aria-live="polite">
      <p className="break-words text-xs">Anterior: {identificar(resultado.anterior)}<br />Posterior: {identificar(resultado.posterior)}</p>
      {resultado.igual ? <p>Os textos salvos são iguais.</p> : <>
        <p className="text-xs text-muted-foreground">{resultado.agrupado ? "Texto extenso: comparação agrupada do primeiro ao último ponto diferente. Os blocos podem incluir linhas intermediárias iguais." : "Trechos removidos e incluídos, na ordem do texto. Linhas iguais foram omitidas; um trecho movido pode aparecer como remoção e inclusão."}</p>
        {resultado.trechos.filter((trecho) => trecho.tipo !== "mantido").map((trecho, index) => <div key={index} className="min-w-0 rounded-lg border p-3">
          <p className="mb-2 font-semibold">{trecho.tipo === "removido" ? "− Removido da versão anterior" : "+ Incluído na versão posterior"}</p>
          <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{trecho.linhas.join("\n") || "(linha em branco)"}</p>
        </div>)}
      </>}
    </div>}
  </section>
}
