import { z } from "zod"

export const objetivosTreino = { passes: "Passe e recepção", conducao: "Condução de bola", cooperacao: "Cooperação e ocupação do espaço" } as const
export const treinoSchema = z.object({
  turma: z.string().trim().min(1).max(100),
  faixa: z.enum(["6–8", "9–11", "12–15", "16–17"]),
  duracao: z.union([z.literal(30), z.literal(45), z.literal(60)]),
  objetivo: z.enum(["passes", "conducao", "cooperacao"]),
  bolas: z.boolean(), cones: z.boolean(),
})
export type PreferenciasTreino = z.infer<typeof treinoSchema>

export function prepararPlanoTreino(input: PreferenciasTreino) {
  const parsed = treinoSchema.safeParse(input)
  if (!parsed.success) return { error: "Confira turma, faixa etária, duração, objetivo e materiais." }
  const p = parsed.data
  if (!p.bolas) return { error: "As atividades deste catálogo precisam de bola. Selecione esse material apenas se estiver disponível." }
  const minutos = p.duracao === 30 ? [5, 10, 10, 5] : p.duracao === 45 ? [8, 15, 17, 5] : [10, 20, 25, 5]
  const limite = p.cones ? "Delimite o espaço com cones." : "Use as linhas existentes da quadra para delimitar o espaço; não improvise obstáculos."
  const atividade = {
    passes: "Em duplas, alternar passes e recepções, ajustando a distância ao grupo. Observar controle da bola e comunicação, sem classificação individual.",
    conducao: "Organizar pequenos grupos para conduzir a bola entre pontos do espaço demarcado. Alternar trajetos e dar tempo para todos experimentarem.",
    cooperacao: "Em pequenos grupos, trocar passes e procurar espaços livres. Alternar os papéis e combinar formas de incluir todos na atividade.",
  }[p.objetivo]
  const adaptacao = p.faixa === "6–8" ? "Usar demonstrações curtas, linguagem lúdica e uma regra por vez." : p.faixa === "9–11" ? "Demonstrar a tarefa, conferir a compreensão e introduzir uma variação por vez." : "Combinar decisões em grupo e alternar papéis, ajustando a complexidade à experiência observada."
  const blocos = [
    { titulo: "Acolhimento e exploração", minutos: minutos[0], descricao: `Apresentar o objetivo, explorar o espaço e a bola com o grupo. ${limite}` },
    { titulo: "Atividade principal", minutos: minutos[1], descricao: `${atividade} ${adaptacao}` },
    { titulo: "Jogo adaptado", minutos: minutos[2], descricao: "Organizar jogo em grupos pequenos, com rodízio para participação de todos. O técnico define as regras e ajusta espaço, pausas e equipes às condições reais." },
    { titulo: "Conversa final", minutos: minutos[3], descricao: "Ouvir o que o grupo aprendeu e registrar ajustes para o próximo encontro, sem ranking de atletas." },
  ]
  return { plano: { blocos, texto: `PLANO DE TREINO — RASCUNHO LOCAL\nTurma: ${p.turma}\nFaixa etária de referência: ${p.faixa} anos\nDuração total: ${p.duracao} minutos (inclui pausas e transições)\nObjetivo: ${objetivosTreino[p.objetivo]}\nMateriais: bolas${p.cones ? " e cones" : "; usar linhas da quadra"}\n\n${blocos.map((b) => `${b.titulo} — ${b.minutos} min\n${b.descricao}`).join("\n\n")}\n\nRevisão do técnico: conferir espaço, quantidade de bolas, composição do grupo e adaptações necessárias. Ajustar ou interromper atividades quando necessário. Sugestão geral, sem prescrição individual ou avaliação médica. O catálogo precisa da validação da comissão antes do uso.` } }
}
