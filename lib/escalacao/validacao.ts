import { POSICOES, POSICOES_QUADRA } from "./posicoes"

export type JogadorEscalado = {
  alunoId: number
  posicao: string
  numero?: number | null
  ordem?: number
}

export function validarEscalacao(
  jogadores: JogadorEscalado[]
): { ok: true } | { ok: false; erro: string } {
  const alunosVistos = new Set<number>()
  const quadraOcupada = new Set<string>()
  const posicoesValidas = POSICOES as readonly string[]
  const posicoesQuadra = POSICOES_QUADRA as readonly string[]

  for (const j of jogadores) {
    if (!posicoesValidas.includes(j.posicao)) {
      return { ok: false, erro: `Posição inválida: ${j.posicao}` }
    }
    if (alunosVistos.has(j.alunoId)) {
      return { ok: false, erro: "Um aluno foi escalado mais de uma vez." }
    }
    alunosVistos.add(j.alunoId)
    if (posicoesQuadra.includes(j.posicao)) {
      if (quadraOcupada.has(j.posicao)) {
        return { ok: false, erro: `Mais de um jogador na posição ${j.posicao}.` }
      }
      quadraOcupada.add(j.posicao)
    }
  }
  return { ok: true }
}
