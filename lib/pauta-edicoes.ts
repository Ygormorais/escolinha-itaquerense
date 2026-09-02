type ConteudoPauta = { turma: string; cicloInicio: string; texto: string }

// Mesma normalização usada no salvamento; espaços internos continuam relevantes.
const normalizar = (texto: string) => texto.replace(/\r\n?/g, "\n").trim()
const mesmoContexto = (a: ConteudoPauta, b: ConteudoPauta) => a.turma === b.turma && a.cicloInicio === b.cicloInicio

export function pautaEstaSalva(rascunho: ConteudoPauta | null, texto: string, salvo: ConteudoPauta | null): boolean {
  return rascunho !== null && salvo !== null && mesmoContexto(rascunho, salvo) && normalizar(texto) === normalizar(salvo.texto)
}

/** Não depende da turma selecionada nos filtros, nem da confirmação de revisão. */
export function pautaTemEdicoesPendentes(rascunho: ConteudoPauta | null, texto: string, salvo: ConteudoPauta | null): boolean {
  if (!rascunho) return false
  const referencia = salvo && mesmoContexto(rascunho, salvo) ? salvo.texto : rascunho.texto
  return normalizar(texto) !== normalizar(referencia)
}
