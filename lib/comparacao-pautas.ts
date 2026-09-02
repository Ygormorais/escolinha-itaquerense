import { MAX_TEXTO_PAUTA, type PautaSemanalSalva } from "@/lib/pauta-semanal"

type Trecho = { tipo: "mantido" | "removido" | "incluido"; linhas: string[] }
const MAX_CELULAS = 250_000

/** Comparação textual, sem inferir evolução esportiva. Custo limitado no mobile. */
export function compararPautas(a: PautaSemanalSalva, b: PautaSemanalSalva) {
  if (a.id === b.id) throw new Error("Selecione duas versões diferentes.")
  if (a.turma !== b.turma) throw new Error("Selecione versões da mesma turma.")
  if (a.texto.length > MAX_TEXTO_PAUTA || b.texto.length > MAX_TEXTO_PAUTA) throw new Error("O texto excede o limite de comparação.")
  // IDs refletem a ordem de gravação, mesmo com datas iguais ou ciclos distintos.
  const [anterior, posterior] = a.id < b.id ? [a, b] : [b, a]
  const linhas = (texto: string) => texto === "" ? [] : texto.replace(/\r\n?/g, "\n").split("\n")
  const antes = linhas(anterior.texto)
  const depois = linhas(posterior.texto)
  let inicio = 0
  while (inicio < antes.length && inicio < depois.length && antes[inicio] === depois[inicio]) inicio++
  let fim = 0
  while (fim < antes.length - inicio && fim < depois.length - inicio && antes[antes.length - 1 - fim] === depois[depois.length - 1 - fim]) fim++
  const esquerda = antes.slice(inicio, antes.length - fim)
  const direita = depois.slice(inicio, depois.length - fim)
  const trechos: Trecho[] = []
  const adicionar = (tipo: Trecho["tipo"], valores: string[]) => {
    if (!valores.length) return
    const ultimo = trechos.at(-1)
    if (ultimo?.tipo === tipo) {
      for (const valor of valores) ultimo.linhas.push(valor)
    } else trechos.push({ tipo, linhas: valores.slice() })
  }
  adicionar("mantido", antes.slice(0, inicio))
  const agrupado = (esquerda.length + 1) * (direita.length + 1) > MAX_CELULAS
  if (agrupado || !esquerda.length || !direita.length) {
    adicionar("removido", esquerda)
    adicionar("incluido", direita)
  } else {
    const largura = direita.length + 1
    const lcs = new Uint32Array((esquerda.length + 1) * largura)
    for (let i = esquerda.length - 1; i >= 0; i--) {
      for (let j = direita.length - 1; j >= 0; j--) {
        lcs[i * largura + j] = esquerda[i] === direita[j]
          ? 1 + lcs[(i + 1) * largura + j + 1]
          : Math.max(lcs[(i + 1) * largura + j], lcs[i * largura + j + 1])
      }
    }
    let i = 0
    let j = 0
    while (i < esquerda.length || j < direita.length) {
      if (i < esquerda.length && j < direita.length && esquerda[i] === direita[j]) {
        adicionar("mantido", [esquerda[i++]])
        j++
      } else if (i < esquerda.length && (j === direita.length || lcs[(i + 1) * largura + j] >= lcs[i * largura + j + 1])) {
        adicionar("removido", [esquerda[i++]])
      } else adicionar("incluido", [direita[j++]])
    }
  }
  adicionar("mantido", antes.slice(antes.length - fim))
  return { anterior, posterior, agrupado, igual: esquerda.length === 0 && direita.length === 0, trechos }
}
