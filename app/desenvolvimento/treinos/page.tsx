import { redirectIfNotAuthenticated } from "@/lib/auth"
import { listarTurmasAtivasDesenvolvimento } from "@/lib/desenvolvimento-turmas"
import { PageHeader } from "@/components/layout/page-header"
import { PlanejamentoTreino } from "@/components/desenvolvimento/planejamento-treino"
import { BibliotecaAtividades } from "@/components/desenvolvimento/biblioteca-atividades"
import { DiarioTreino } from "@/components/desenvolvimento/diario-treino"
import { ValidacaoCatalogo } from "@/components/desenvolvimento/validacao-catalogo"

export const metadata = { title: "Treinos — Desenvolvimento" }
export default async function TreinosDesenvolvimentoPage() { await redirectIfNotAuthenticated(["admin", "tecnico"])(); const turmas = await listarTurmasAtivasDesenvolvimento(); return <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8"><PageHeader title="Treinos" description="Planejamento, biblioteca versionada, validação e diário técnico." /><PlanejamentoTreino /><BibliotecaAtividades /><DiarioTreino turmas={turmas} /><ValidacaoCatalogo turmas={turmas} /></div> }
