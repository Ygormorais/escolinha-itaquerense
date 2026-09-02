type ConteudoResumo = { mes: string; texto: string }

// O servidor normaliza apenas as bordas do resumo, sem alterar quebras internas.
export function resumoEstaSalvo(resumo: ConteudoResumo | null, texto: string, salvo: ConteudoResumo | null): boolean {
  return resumo !== null && salvo !== null && resumo.mes === salvo.mes && texto.trim() === salvo.texto.trim()
}

export function resumoTemEdicoesPendentes(resumo: ConteudoResumo | null, texto: string, salvo: ConteudoResumo | null): boolean {
  if (!resumo) return false
  const referencia = salvo?.mes === resumo.mes ? salvo.texto : resumo.texto
  return texto.trim() !== referencia.trim()
}
