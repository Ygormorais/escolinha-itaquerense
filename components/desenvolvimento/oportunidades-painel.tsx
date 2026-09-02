"use client"

import Link from "next/link"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { OportunidadeResumo } from "@/lib/oportunidades"

const situacoes: Record<OportunidadeResumo["situacao"], string> = {
  revisar: "Revisar oportunidade",
  com_convocacao: "Com convocação registrada",
  sem_jogos: "Sem jogos no recorte",
  amostra_insuficiente: "Poucos registros de frequência",
  presenca_abaixo_limiar: "Presença abaixo de 80%",
}
const avaliacoes: Record<OportunidadeResumo["avaliacao"], string> = {
  recente: "Avaliação nos últimos 180 dias",
  pendente: "Avaliação pendente",
  periodo_inicial: "Período inicial de matrícula",
}

export function OportunidadesPainel({ atletas }: { atletas: OportunidadeResumo[] }) {
  const [turma, setTurma] = useState("")
  const [busca, setBusca] = useState("")
  const turmas = [...new Set(atletas.map((item) => item.turma))].sort((a, b) => a.localeCompare(b, "pt-BR"))
  const grupo = atletas.filter((item) => !turma || item.turma === turma)
  const visiveis = grupo.filter((item) => item.nome.toLocaleLowerCase("pt-BR").includes(busca.toLocaleLowerCase("pt-BR"))).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR") || a.alunoId - b.alunoId)
  const comJogos = grupo.filter((item) => item.jogos > 0)

  return (
    <section aria-labelledby="opportunities-title" className="space-y-4">
      <div>
        <h2 id="opportunities-title" className="font-heading text-xl font-bold">Equidade de oportunidades</h2>
        <p className="text-sm text-muted-foreground">Visão de acompanhamento por turma, sem ranking de atletas. Frequência e jogos: últimos 90 dias.</p>
      </div>
      <div className="grid max-w-3xl items-end gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="opportunities-class" className="leading-snug">Turma de acompanhamento</Label>
          <select id="opportunities-class" value={turma} onChange={(event) => setTurma(event.target.value)} className="h-11 w-full min-w-0 rounded-[var(--radius-control)] border border-input bg-background px-3 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15">
            <option value="">Todas as turmas</option>
            {turmas.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="opportunities-search" className="leading-snug">Buscar atleta nas oportunidades</Label>
          <Input id="opportunities-search" value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Nome do atleta" />
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Atletas ativos", `${grupo.length}`],
          ["Avaliações recentes", `${grupo.filter((item) => item.avaliacao === "recente").length} de ${grupo.length}`],
          ["Atletas convocados no recorte", `${comJogos.filter((item) => item.convocacoes > 0).length} de ${comJogos.length}`],
          ["Oportunidades a revisar", `${grupo.filter((item) => item.situacao === "revisar").length}`],
        ].map(([label, value]) => <div key={label} className="rounded-[var(--radius-card)] border bg-card p-4"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-2xl font-bold tabular-nums">{value}</dd></div>)}
      </dl>
      <p className="text-xs text-muted-foreground">Totais da turma selecionada, independentemente da busca por nome. A cobertura de convocações considera somente atletas com jogos no recorte.</p>
      <details className="rounded-lg border bg-card p-3 text-sm">
        <summary className="cursor-pointer font-semibold">Como interpretar estes dados</summary>
        <div className="mt-2 space-y-2 text-muted-foreground">
          <p>Contamos apenas jogos com resultado registrado, nos campeonatos do atleta, após a matrícula e o cadastro da inscrição. Cadastros tardios e resultados ausentes podem reduzir a amostra.</p>
          <p>Revisar oportunidade significa presença de pelo menos 80%, com quatro ou mais registros e nenhuma convocação nos jogos do recorte. Sem registros não significa ausência. Uma convocação não comprova participação nem minutos jogados.</p>
          <p>Avaliação pendente: nenhuma avaliação nos últimos 180 dias e matrícula há pelo menos 90 dias. Período inicial não é atraso.</p>
          <p>Estes sinais não comprovam desigualdade: disponibilidade, contexto e decisões técnicas precisam ser revisados pela comissão. Os indicadores acionáveis continuam na fila da semana.</p>
        </div>
      </details>
      <p role="status" className="text-sm text-muted-foreground">{visiveis.length} atleta(s) na lista, em ordem alfabética.</p>
      {visiveis.length === 0 ? <p className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">Nenhum atleta neste filtro.</p> : (
        <ul className="grid gap-3 xl:grid-cols-2">
          {visiveis.map((item) => <li key={item.alunoId} className="min-w-0 rounded-[var(--radius-card)] border bg-card p-4">
            <Link href={`/alunos/${item.alunoId}`} className="font-semibold text-brand-700 underline underline-offset-4 break-words dark:text-brand-300">{item.nome}</Link>
            <p className="text-xs text-muted-foreground">{item.turma}</p>
            <p className="mt-2 text-sm font-semibold">{situacoes[item.situacao]}</p>
            <dl className="mt-2 space-y-1 text-sm">
              <div><dt className="inline text-muted-foreground">Presença: </dt><dd className="inline">{item.presenca === null ? "Sem registros" : `${item.presenca.toLocaleString("pt-BR")}% (${item.registros} registros)`}</dd></div>
              <div><dt className="inline text-muted-foreground">Convocações no recorte: </dt><dd className="inline">{item.jogos === 0 ? "Sem jogos para analisar" : `${item.convocacoes} em ${item.jogos} jogo(s)`}</dd></div>
              <div><dt className="sr-only">Avaliação: </dt><dd className="inline">{avaliacoes[item.avaliacao]}</dd></div>
            </dl>
          </li>)}
        </ul>
      )}
    </section>
  )
}
