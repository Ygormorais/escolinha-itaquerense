import { describe, it, expect } from "vitest"
import { parseJogos, parseClassificacao } from "../fpfs/parser"

const HTML_JOGOS = `
<table class="classification_table">
  <tbody>
    <tr>
      <td>11/04</td>
      <td>19h</td>
      <td>Ginásio A</td>
      <td>
        <span class="nome_clube">Escolinha A</span>
        <span class="result">2 x 1</span>
        <span class="nome_clube">Escolinha B</span>
        <a href="?id_jogo=42&sumula=1">Súmula</a>
      </td>
    </tr>
    <tr>
      <td>Cabeçalho sem data</td>
      <td></td><td></td><td></td>
    </tr>
  </tbody>
</table>`

const HTML_CLASSIFICACAO = `
<table class="classification_table">
  <tbody>
    <tr>
      <td>Grupo A</td>
      <td>1</td>
      <td><span class="nome_clube">Escolinha A</span></td>
      <td>9</td><td>3</td><td>3</td><td>0</td><td>0</td><td>8</td><td>2</td><td>6</td>
    </tr>
  </tbody>
</table>`

describe("parseJogos", () => {
  it("extrai jogo com placar e súmula", () => {
    const jogos = parseJogos(HTML_JOGOS, 2025)
    expect(jogos).toHaveLength(1)
    expect(jogos[0]).toMatchObject({
      mandante: "Escolinha A",
      visitante: "Escolinha B",
      golsMandante: 2,
      golsVisitante: 1,
      fpfsJogoId: "42",
      data: "2025-04-11",
      hora: "19",
      ginasio: "Ginásio A",
    })
  })

  it("ignora linhas sem data válida", () => {
    const jogos = parseJogos(HTML_JOGOS, 2025)
    expect(jogos).toHaveLength(1)
  })

  it("retorna lista vazia para HTML sem tabela", () => {
    expect(parseJogos("<html></html>")).toEqual([])
  })

  it("usa ano corrente quando anoTemporada não fornecido", () => {
    const jogos = parseJogos(HTML_JOGOS)
    const anoEsperado = String(new Date().getFullYear())
    expect(jogos[0].data).toContain(anoEsperado)
  })
})

describe("parseClassificacao", () => {
  it("extrai linha de classificação", () => {
    const linhas = parseClassificacao(HTML_CLASSIFICACAO)
    expect(linhas).toHaveLength(1)
    expect(linhas[0]).toMatchObject({
      timeNome: "Escolinha A",
      pontos: 9,
      jogos: 3,
      vitorias: 3,
      empates: 0,
      derrotas: 0,
      golsPro: 8,
      golsContra: 2,
      saldo: 6,
      posicao: 1,
    })
  })

  it("retorna lista vazia para HTML sem tabela válida", () => {
    expect(parseClassificacao("<html></html>")).toEqual([])
  })
})
