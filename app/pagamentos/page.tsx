import { PAGINA_ADMIN } from "@/components/layout/pagina"
import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { PagamentosClient } from "./pagamentos-client"
import { CentralClient } from "./central-client"
import { PainelAluno } from "./painel-aluno"
import { getConfig } from "@/lib/config"
import { carregarCentral, carregarMensalidadesDoMes, type FiltroCentral } from "@/lib/central-pagamentos"

export const metadata = { title: "Pagamentos — Escolinha Itaquerense" }

type Situacao = Exclude<FiltroCentral["situacao"], "pagos">

function situacaoDaUrl(filtro: string | undefined): Situacao | "mes" {
  if (filtro === "atrasados" || filtro === "com_desconto" || filtro === "mes") return filtro
  return "aberto"
}

export default async function PagamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; filtro?: string; aluno?: string }>
}) {
  const params = await searchParams
  const agora = new Date()
  const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`
  const mes = params.mes ?? mesAtual
  const filtro = situacaoDaUrl(params.filtro)
  const config = getConfig()

  // Visão do mês: tabela de todas as mensalidades do mês (pagas ou não), como era antes da central.
  if (filtro === "mes") {
    const pagamentos = await carregarMensalidadesDoMes(db, mes)
    return (
      <div data-page="pagamentos" className={PAGINA_ADMIN}>
        <PageHeader title="Pagamentos" description={`Controle de mensalidades — ${mes}`} />
        <PagamentosClient
          pagamentos={pagamentos}
          mes={mes}
          chavePix={config.chavePix}
          nomeClube={config.nome}
          cidade={config.cidade}
        />
      </div>
    )
  }

  const devedores = await carregarCentral(db, agora)
  const alunoId = params.aluno ? Number(params.aluno) : null
  return (
    <div data-page="pagamentos" className={PAGINA_ADMIN}>
      <PageHeader title="Pagamentos" description="Quem tem mensalidade em aberto" />
      <CentralClient
        devedores={devedores}
        situacao={filtro}
        mesAtual={mesAtual}
        alunoSelecionado={alunoId}
        painel={alunoId !== null ? <PainelAluno key={alunoId} alunoId={alunoId} agora={agora} /> : undefined}
      />
    </div>
  )
}
