/** Proporção da foto 3×4 (largura / altura). */
export const PROPORCAO_FOTO = 3 / 4

/** Maior lado da imagem gravada; 600×800 é nítido para carteirinha e pesa poucos KB. */
export const ALTURA_MAX_FOTO = 800

export type Recorte = { sx: number; sy: number; sw: number; sh: number }

/** Maior retângulo 3×4 (retrato) centralizado dentro de um quadro de `largura` × `altura`. */
export function recorteRetrato34(largura: number, altura: number): Recorte {
  if (largura <= 0 || altura <= 0) return { sx: 0, sy: 0, sw: 0, sh: 0 }
  if (largura / altura > PROPORCAO_FOTO) {
    // quadro mais largo que 3×4 (caso comum da webcam 16:9): corta as laterais
    const sw = Math.round(altura * PROPORCAO_FOTO)
    return { sx: Math.round((largura - sw) / 2), sy: 0, sw, sh: altura }
  }
  // quadro mais estreito (celular em pé): corta em cima e embaixo
  const sh = Math.round(largura / PROPORCAO_FOTO)
  return { sx: 0, sy: Math.round((altura - sh) / 2), sw: largura, sh }
}

/** Tamanho final do canvas: mantém 3×4 e nunca amplia além do recorte. */
export function tamanhoSaida(recorte: Recorte): { largura: number; altura: number } {
  const altura = Math.min(recorte.sh, ALTURA_MAX_FOTO)
  return { largura: Math.round(altura * PROPORCAO_FOTO), altura }
}
