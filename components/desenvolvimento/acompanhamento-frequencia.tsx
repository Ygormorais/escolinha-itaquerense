"use client"

import { useState, useTransition } from "react"
import { consultarAcompanhamentoFrequencia } from "@/app/actions/acompanhamento-frequencia"
import type { AcompanhamentoFrequencia } from "@/lib/acompanhamento-frequencia"
import { Button } from "@/components/ui/button"

const dataCivil = (value: string) => value.split("-").reverse().join("/")

export function AcompanhamentoFrequenciaAcao({ acaoId }: { acaoId: number }) {
  const [dados, setDados] = useState<AcompanhamentoFrequencia | null>(null)
  const [erro, setErro] = useState("")
  const [aberto, setAberto] = useState(false)
  const [pending, startTransition] = useTransition()
  const carregar = () => {
    setAberto(true); setErro(""); setDados(null)
    startTransition(async () => {
      try {
        const result = await consultarAcompanhamentoFrequencia(acaoId)
        if (result.error || !result.acompanhamento) { setErro(result.error ?? "Não foi possível consultar a frequência."); return }
        setDados(result.acompanhamento)
      } catch { setErro("Não foi possível consultar a frequência. Verifique sua sessão e tente novamente.") }
    })
  }
  return <div className="mt-3">
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" disabled={pending} onClick={carregar} aria-expanded={aberto} aria-controls={aberto ? `attendance-followup-${acaoId}` : undefined}>{dados && aberto ? "Atualizar comparação" : "Ver frequência antes/depois"}</Button>
      {aberto && <Button variant="ghost" size="sm" disabled={pending} onClick={() => setAberto(false)}>Ocultar comparação</Button>}
    </div>
    {aberto && <section id={`attendance-followup-${acaoId}`} aria-label="Frequência antes e depois da ação" className="mt-3 space-y-3 rounded-lg bg-muted/40 p-3">
      {pending && <p role="status" className="text-sm">Consultando frequência registrada...</p>}
      {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
      {dados && <>
        <p className="text-xs text-muted-foreground">Conclusão registrada em {new Date(dados.concluidaEm).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}. Esta é a data em que a ação foi marcada como concluída, não necessariamente o dia em que ela foi realizada.</p>
        <p className="text-sm font-semibold">{dados.situacao === "em_observacao" ? `Em observação: ${dados.diasCompletos} de 30 dias completos após a conclusão.` : dados.situacao === "amostra_insuficiente" ? "Amostra insuficiente para comparar os períodos." : "Períodos completos e com amostra mínima."}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {([
            ["Antes", dados.inicioAntes, dados.fimAntes, dados.antes],
            ["Depois", dados.inicioDepois, dados.fimDepois, dados.depois],
          ] as const).map(([titulo, inicio, fim, valores]) => <div key={titulo} className="min-w-0 rounded-lg border bg-card p-3">
            <p className="font-semibold">{titulo}</p>
            <p className="text-xs text-muted-foreground">{dataCivil(inicio)} a {dataCivil(fim)}</p>
            <p className="mt-2 text-xl font-bold">{valores.percentual === null ? "Sem registros" : `${valores.percentual.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`}</p>
            <p className="text-xs text-muted-foreground">{valores.presentes} presença(s) em {valores.total} registro(s) válido(s).</p>
            <p className="text-xs text-muted-foreground">{valores.ausentes} ausência(s) · {valores.justificados} falta(s) justificada(s).</p>
            {valores.desconsiderados > 0 && <p className="mt-1 text-xs text-muted-foreground">{valores.desconsiderados} registro(s) com situação desconhecida fora da contagem.</p>}
          </div>)}
        </div>
        {dados.variacao !== null && <p className="text-sm font-semibold">Variação da presença registrada: {dados.variacao > 0 ? "+" : ""}{dados.variacao.toLocaleString("pt-BR")} pontos percentuais.</p>}
        <p className="text-xs text-muted-foreground">Cada janela tem 30 dias e exige pelo menos {dados.minimoRegistros} registros válidos. O dia da conclusão fica fora das duas janelas. Faltas justificadas entram no total, mas não como presença. Períodos em andamento incluem os registros disponíveis de hoje; a variação só aparece após os 30 dias completos.</p>
        <p className="text-xs text-muted-foreground">Esta comparação não comprova efeito da ação: calendário, disponibilidade e outros fatores podem influenciar a frequência. Ausência de registros não significa faltas. Os números podem mudar se a equipe corrigir os registros.</p>
        <p className="text-xs text-muted-foreground">Consultado em {new Date(dados.consultadoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}.</p>
      </>}
    </section>}
  </div>
}
