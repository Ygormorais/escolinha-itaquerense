import { redirectIfNotAuthenticated } from "@/lib/auth"
import { carregarPainelDesenvolvimento } from "@/lib/desenvolvimento-data"
import { DesenvolvimentoClient } from "./desenvolvimento-client"
import { iaExternaDesenvolvimentoHabilitada } from "@/lib/desenvolvimento-ai"

export const metadata = { title: "Desenvolvimento — Escolinha Itaquerense" }

export default async function DesenvolvimentoPage() {
  await redirectIfNotAuthenticated(["admin", "tecnico"])()
  const panel = await carregarPainelDesenvolvimento()

  return (
    <DesenvolvimentoClient
      iaExternaHabilitada={iaExternaDesenvolvimentoHabilitada()}
      cicloInicio={panel.cicloInicio}
      insights={panel.insights}
      oportunidades={panel.oportunidades}
      acoes={Object.fromEntries(Object.entries(panel.acoes).map(([key, action]) => [key, {
        status: action.status,
        observacao: action.observacao,
        usuario: action.usuario,
        planoSemanal: action.planoSemanal,
        mensagemFamilia: action.mensagemFamilia,
        rascunhoFonte: action.rascunhoFonte,
        rascunhoAprovado: action.rascunhoAprovadoEm !== null,
      }]))}
      historico={panel.historico.map((item) => ({
        ...item,
        updatedAt: item.updatedAt.toISOString(),
      }))}
    />
  )
}
