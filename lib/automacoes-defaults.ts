import { db } from "@/lib/db"

export const regrasAutomacaoPadrao = [
  { titulo: "Cobrar mensalidades vencidas", tipo: "mensalidade_vencida", antecedenciaDias: 1 },
  { titulo: "Acompanhar renovações pendentes", tipo: "renovacao_pendente", antecedenciaDias: 3 },
  { titulo: "Revisar documentos sem aceite", tipo: "documento_pendente", antecedenciaDias: 0 },
  { titulo: "Acompanhar objetivos próximos do prazo", tipo: "objetivo_vencendo", antecedenciaDias: 7 },
] as const

export async function instalarRegrasAutomacaoPadrao(criadaPor: string) {
  const responsavelAtual = await db.usuario.findFirst({ where: { username: criadaPor, ativo: true, role: { in: ["admin", "secretaria"] } }, select: { id: true } })
  const responsavel = responsavelAtual ?? await db.usuario.findFirst({ where: { ativo: true, role: { in: ["admin", "secretaria"] } }, orderBy: { id: "asc" }, select: { id: true } })
  if (!responsavel) return { error: "Cadastre um usuário administrativo ativo antes de instalar as regras." } as const
  const existentes = new Set((await db.regraAutomacao.findMany({ select: { tipo: true } })).map((regra) => regra.tipo))
  const novas = regrasAutomacaoPadrao.filter((regra) => !existentes.has(regra.tipo))
  if (novas.length) await db.regraAutomacao.createMany({ data: novas.map((regra) => ({ ...regra, responsavelId: responsavel.id, criadaPor })) })
  return { criadas: novas.length } as const
}
