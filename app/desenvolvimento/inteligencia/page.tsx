import { redirectIfNotAuthenticated } from "@/lib/auth"
import { carregarPainelDesenvolvimento } from "@/lib/desenvolvimento-data"
import { listarTurmasAtivasDesenvolvimento } from "@/lib/desenvolvimento-turmas"
import { PageHeader } from "@/components/layout/page-header"
import { BuscaOperacionalLocal } from "@/components/desenvolvimento/busca-operacional-local"
import { EvolucaoColetiva } from "@/components/desenvolvimento/evolucao-coletiva"
import { ComparativoDesenvolvimento } from "@/components/desenvolvimento/comparativo-desenvolvimento"
import { SugestoesLocaisTreino } from "@/components/desenvolvimento/sugestoes-locais-treino"
import { RelatorioGerencial } from "@/components/desenvolvimento/relatorio-gerencial"
import { OportunidadesPainel } from "@/components/desenvolvimento/oportunidades-painel"
import { RiscoParticipacao } from "@/components/desenvolvimento/risco-participacao"

export const metadata = { title: "Inteligência local — Desenvolvimento" }
export default async function InteligenciaDesenvolvimentoPage() { await redirectIfNotAuthenticated(["admin", "tecnico"])(); const [turmas, painel] = await Promise.all([listarTurmasAtivasDesenvolvimento(), carregarPainelDesenvolvimento()]); return <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8"><PageHeader title="Inteligência local" description="Consultas explicáveis, comparativos coletivos e sugestões sem API paga." /><RiscoParticipacao insights={painel.insights} /><BuscaOperacionalLocal /><EvolucaoColetiva turmas={turmas} /><ComparativoDesenvolvimento /><SugestoesLocaisTreino turmas={turmas} /><RelatorioGerencial turmas={turmas} /><OportunidadesPainel atletas={painel.oportunidades} /></div> }
