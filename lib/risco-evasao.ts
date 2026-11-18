import { plural } from "@/lib/utils"
import { preencherModelo, textoDoModelo, whatsappHrefPara, type ModelosPersonalizados } from "@/lib/whatsapp-modelos"

/**
 * Alerta de risco de evasão: regras fixas e transparentes (sem IA).
 *  - Faltas seguidas: presenças "Ausente" consecutivas, da chamada mais recente para trás.
 *    "Justificado" é ignorado (não conta como falta nem interrompe a sequência);
 *    "Presente" interrompe.
 *  - Mensalidades em atraso: vencidas e sem baixa.
 *  Risco alto: faltas seguidas e mensalidade em atraso ao mesmo tempo.
 *  Risco médio: só faltas seguidas, ou duas ou mais mensalidades em atraso.
 */
export const MIN_FALTAS_SEGUIDAS = 3
export const MIN_MENSALIDADES_ATRASADAS = 2

export type NivelRisco = "alto" | "medio"

export type Sinais = { faltasSeguidas: number; mensalidadesAtrasadas: number }

export function contarFaltasSeguidas(presencas: { data: Date; presenca: string }[]): number {
  const recentes = [...presencas].sort((a, b) => b.data.getTime() - a.data.getTime())
  let faltas = 0
  for (const p of recentes) {
    if (p.presenca === "Justificado") continue
    if (p.presenca !== "Ausente") break
    faltas++
  }
  return faltas
}

export function avaliarRisco({ faltasSeguidas, mensalidadesAtrasadas }: Sinais): { nivel: NivelRisco; motivos: string[] } | null {
  const faltas = faltasSeguidas >= MIN_FALTAS_SEGUIDAS
  const atraso = mensalidadesAtrasadas >= 1
  const atrasoGrave = mensalidadesAtrasadas >= MIN_MENSALIDADES_ATRASADAS
  if (!(faltas || atrasoGrave)) return null

  const motivos: string[] = []
  if (faltas) motivos.push(`${plural(faltasSeguidas, "falta seguida", "faltas seguidas")}`)
  if (atraso) motivos.push(`${plural(mensalidadesAtrasadas, "mensalidade em atraso", "mensalidades em atraso")}`)
  return { nivel: faltas && atraso ? "alto" : "medio", motivos }
}

export type AlunoAtencao = {
  id: number
  nome: string
  turma: string
  nivel: NivelRisco
  motivos: string[]
  faltasSeguidas: number
  mensalidadesAtrasadas: number
  whatsappHref: string | null
}

/** Frase de abertura da mensagem acolhedora, conforme o que motivou o alerta. */
export function motivoParaMensagem(s: Sinais): string {
  const partes: string[] = []
  if (s.faltasSeguidas >= MIN_FALTAS_SEGUIDAS) partes.push("Sentimos falta nos últimos treinos.")
  if (s.mensalidadesAtrasadas >= 1) partes.push("Vimos também que há mensalidade em aberto e podemos ajudar a combinar o melhor jeito de resolver.")
  return partes.join(" ")
}

type EntradaAtencao = {
  id: number
  nome: string
  turma: string
  responsavel: string
  telefone: string
  presencas: { data: Date; presenca: string }[]
  mensalidadesAtrasadas: number
}

/** Do mais grave para o menos grave; empate por faltas, depois atrasos e nome. */
export function montarListaAtencao(
  alunos: EntradaAtencao[],
  contexto: { clube: string; modelos?: ModelosPersonalizados | null },
): AlunoAtencao[] {
  const lista: AlunoAtencao[] = []
  for (const a of alunos) {
    const sinais = { faltasSeguidas: contarFaltasSeguidas(a.presencas), mensalidadesAtrasadas: a.mensalidadesAtrasadas }
    const risco = avaliarRisco(sinais)
    if (!risco) continue
    const mensagem = preencherModelo(textoDoModelo("atencao", contexto.modelos), {
      responsavel: a.responsavel.trim().split(/\s+/)[0] || "responsável",
      aluno: a.nome.trim().split(/\s+/)[0],
      clube: contexto.clube,
      motivo: motivoParaMensagem(sinais),
    })
    lista.push({
      id: a.id,
      nome: a.nome,
      turma: a.turma,
      nivel: risco.nivel,
      motivos: risco.motivos,
      ...sinais,
      whatsappHref: whatsappHrefPara(a.telefone, mensagem),
    })
  }
  const peso = (n: NivelRisco) => (n === "alto" ? 1 : 0)
  return lista.sort(
    (x, y) =>
      peso(y.nivel) - peso(x.nivel) ||
      y.faltasSeguidas - x.faltasSeguidas ||
      y.mensalidadesAtrasadas - x.mensalidadesAtrasadas ||
      x.nome.localeCompare(y.nome, "pt-BR"),
  )
}
