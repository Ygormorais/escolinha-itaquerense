import { redirectIfNotAuthenticated } from "@/lib/auth"
import { listarTurmasAtivasDesenvolvimento } from "@/lib/desenvolvimento-turmas"
import { PageHeader } from "@/components/layout/page-header"
import { CaixaInterna } from "@/components/desenvolvimento/caixa-interna"
import { RotinasOperacionais } from "@/components/desenvolvimento/rotinas-operacionais"
import { QuadroSemanalComissao } from "@/components/desenvolvimento/quadro-semanal-comissao"
import { CentralPendencias } from "@/components/desenvolvimento/central-pendencias"
import { AtividadeSemanalComissao } from "@/components/desenvolvimento/atividade-semanal-comissao"
import { QualidadeCadastros } from "@/components/desenvolvimento/qualidade-cadastros"
import { ConsultasLocais, ResultadosAcoes } from "@/components/desenvolvimento/consultas-locais"

export const metadata = { title: "Operação — Desenvolvimento" }
export default async function OperacaoDesenvolvimentoPage() { await redirectIfNotAuthenticated(["admin", "tecnico"])(); const turmas = await listarTurmasAtivasDesenvolvimento(); return <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8"><PageHeader title="Operação da comissão" description="Caixa interna, rotinas, quadro semanal e qualidade dos registros." /><CaixaInterna /><RotinasOperacionais /><QuadroSemanalComissao turmas={turmas} /><CentralPendencias turmas={turmas} /><AtividadeSemanalComissao turmas={turmas} /><ResultadosAcoes /><QualidadeCadastros /><ConsultasLocais turmas={turmas} /></div> }
