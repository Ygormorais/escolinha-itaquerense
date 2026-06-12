// Mock de next/font/google para o vitest.
// Não usar o nextFontMock.js do Next: ele é um Proxy CJS que responde a
// `then`, virando um thenable que faz o import() dinâmico do vitest pendurar
// para sempre (suíte trava sem erro). Exports nomeados explícitos resolvem.
const font = () => ({
  className: "className",
  variable: "variable",
  style: { fontFamily: "fontFamily" },
})

export const Roboto = font
export const Roboto_Condensed = font
export const Inter = font
export const Nunito = font
export const Playfair_Display = font
