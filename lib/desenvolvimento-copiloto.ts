import { z } from "zod"

export const preferenciasCopilotoSchema = z.object({
  foco: z.enum(["geral", "familia", "treino"]).default("geral"),
  modo: z.enum(["ia", "local"]).default("local"),
}).strict()

export type PreferenciasCopiloto = z.infer<typeof preferenciasCopilotoSchema>

export const focosCopiloto: Record<PreferenciasCopiloto["foco"], { label: string; instrucao: string; acao: string }> = {
  geral: {
    label: "Acompanhamento geral",
    instrucao: "Organize o acompanhamento semanal a partir do próximo passo sugerido no indicador.",
    acao: "Combinar com a comissão quem acompanhará o próximo passo nesta semana.",
  },
  familia: {
    label: "Conversa com a família",
    instrucao: "Priorize escuta e alinhamento com a família, sem presumir causas nem culpabilizar.",
    acao: "Combinar uma conversa com a família para ouvir seu contexto e registrar um próximo passo acordado.",
  },
  treino: {
    label: "Observação em treino",
    instrucao: "Priorize observação e registro pela comissão no treino habitual, sem prescrever exercícios, cargas ou condutas clínicas.",
    acao: "Combinar quem observará a participação no treino habitual e registrar apenas fatos observados, sem alterar cargas ou exercícios.",
  },
}
