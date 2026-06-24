export interface LancamentoRaw {
  data: Date
  descricao: string
  valor: number   // positivo = entrada, negativo = saída
  tipo: "entrada" | "saida"
  saldo: number | null
}

export interface ParseResult {
  lancamentos: LancamentoRaw[]
  banco: string
  erro?: string
}

function parseBRL(v: string): number | null {
  if (!v) return null
  const clean = v.replace(/[R$\s]/g, "")
  let s: string
  if (clean.includes(",")) {
    // Formato BR: 1.500,00 — ponto é milhar, vírgula é decimal
    s = clean.replace(/\./g, "").replace(",", ".")
  } else if (/\.\d{1,2}$/.test(clean)) {
    // Ponto seguido de 1 ou 2 dígitos no final → decimal (formato US)
    s = clean
  } else {
    // Ponto de milhar sem decimal explícito
    s = clean.replace(/\./g, "")
  }
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

function parseDate(s: string): Date | null {
  // dd/mm/yyyy ou yyyy-mm-dd
  const m1 = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (m1) return new Date(+m1[3], +m1[2] - 1, +m1[1])
  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m2) return new Date(+m2[1], +m2[2] - 1, +m2[3])
  return null
}

// -------------------------------------------------------------------
// Nubank  — Data,Descrição,Valor
// Positivo = crédito (entrada), negativo = débito (saída)
// -------------------------------------------------------------------
function parseNubank(linhas: string[][]): LancamentoRaw[] | null {
  const h = linhas[0]?.map((c) => c.toLowerCase().trim()) ?? []
  if (!h.includes("data") || !h.includes("descrição") || !h.includes("valor")) return null

  const iData = h.indexOf("data")
  const iDesc = h.indexOf("descrição")
  const iValor = h.indexOf("valor")

  return linhas.slice(1).flatMap((cols) => {
    const data = parseDate(cols[iData] ?? "")
    const valor = parseBRL(cols[iValor] ?? "")
    if (!data || valor == null) return []
    return [{
      data,
      descricao: cols[iDesc] ?? "",
      valor,
      tipo: valor >= 0 ? "entrada" : "saida",
      saldo: null,
    }]
  })
}

// -------------------------------------------------------------------
// Itaú / Bradesco genérico  — Data,Histórico,Docto,Crédito,Débito,Saldo
// -------------------------------------------------------------------
function parseCreditoDebito(linhas: string[][]): LancamentoRaw[] | null {
  const h = linhas[0]?.map((c) => c.toLowerCase().trim()) ?? []
  const hasCredito = h.some((c) => c.includes("créd") || c === "credito" || c === "crédito" || c === "entrada")
  const hasDebito = h.some((c) => c.includes("déb") || c === "debito" || c === "débito" || c === "saida")
  if (!hasCredito || !hasDebito) return null

  const iData = h.findIndex((c) => c === "data" || c.startsWith("data"))
  const iDesc = h.findIndex((c) => c.includes("hist") || c.includes("descri"))
  const iCred = h.findIndex((c) => c.includes("créd") || c === "credito" || c === "crédito" || c === "entrada")
  const iDeb = h.findIndex((c) => c.includes("déb") || c === "debito" || c === "débito" || c === "saida")
  const iSaldo = h.findIndex((c) => c.includes("saldo"))
  if (iData < 0 || iDesc < 0) return null

  return linhas.slice(1).flatMap((cols) => {
    const data = parseDate(cols[iData] ?? "")
    if (!data) return []
    const cred = iCred >= 0 ? parseBRL(cols[iCred] ?? "") : null
    const deb = iDeb >= 0 ? parseBRL(cols[iDeb] ?? "") : null
    const saldo = iSaldo >= 0 ? parseBRL(cols[iSaldo] ?? "") : null

    if (cred && cred > 0) {
      const item: LancamentoRaw = { data, descricao: cols[iDesc] ?? "", valor: cred, tipo: "entrada", saldo }
      return [item]
    }
    if (deb && deb > 0) {
      const item: LancamentoRaw = { data, descricao: cols[iDesc] ?? "", valor: -deb, tipo: "saida", saldo }
      return [item]
    }
    return []
  })
}

// -------------------------------------------------------------------
// OFX / OFXCSVEXPORT simples  — DTPOSTED,TRNAMT,MEMO
// -------------------------------------------------------------------
function parseOFXLike(linhas: string[][]): LancamentoRaw[] | null {
  const h = linhas[0]?.map((c) => c.toLowerCase().trim()) ?? []
  if (!h.some((c) => c.includes("dtposted") || c.includes("trnamt"))) return null

  const iData = h.findIndex((c) => c.includes("dtposted") || c.includes("data"))
  const iValor = h.findIndex((c) => c.includes("trnamt") || c.includes("valor"))
  const iDesc = h.findIndex((c) => c.includes("memo") || c.includes("descri"))

  return linhas.slice(1).flatMap((cols) => {
    const data = parseDate((cols[iData] ?? "").slice(0, 8).replace(/(\d{4})(\d{2})(\d{2})/, "$3/$2/$1"))
      ?? parseDate(cols[iData] ?? "")
    const valor = parseBRL(cols[iValor] ?? "")
    if (!data || valor == null) return []
    return [{
      data,
      descricao: cols[iDesc] ?? "",
      valor,
      tipo: valor >= 0 ? "entrada" : "saida",
      saldo: null,
    }]
  })
}

function splitCSV(linha: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i]
    if (c === '"') { inQuotes = !inQuotes; continue }
    if ((c === "," || c === ";") && !inQuotes) { result.push(current.trim()); current = ""; continue }
    current += c
  }
  result.push(current.trim())
  return result
}

export function parseExtratoCSV(texto: string, nomeArquivo: string): ParseResult {
  const linhasRaw = texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  // detecta separador
  const amostra = linhasRaw[0] ?? ""
  const sep = amostra.includes(";") ? ";" : ","

  // normaliza separador para splitCSV
  const linhas = linhasRaw.map((l) => splitCSV(l.replace(/;/g, sep === ";" ? "," : ";")))

  // skip linhas de cabeçalho do banco (ex: "Extrato de conta corrente")
  // procura a primeira linha que pareça header real
  let startIdx = 0
  for (let i = 0; i < Math.min(10, linhas.length); i++) {
    const cols = linhas[i].map((c) => c.toLowerCase())
    if (cols.some((c) => c === "data" || c.includes("descriç") || c.includes("histor") || c.includes("dtposted"))) {
      startIdx = i
      break
    }
  }
  const dadosLinhas = linhas.slice(startIdx)
  if (dadosLinhas.length < 2) return { lancamentos: [], banco: "Desconhecido", erro: "Arquivo sem dados reconhecíveis" }

  const banco = nomeArquivo.toLowerCase().includes("nubank") ? "Nubank"
    : nomeArquivo.toLowerCase().includes("itau") || nomeArquivo.toLowerCase().includes("itaú") ? "Itaú"
    : nomeArquivo.toLowerCase().includes("bradesco") ? "Bradesco"
    : nomeArquivo.toLowerCase().includes("santander") ? "Santander"
    : nomeArquivo.toLowerCase().includes("caixa") ? "Caixa Econômica"
    : nomeArquivo.toLowerCase().includes("bb") || nomeArquivo.toLowerCase().includes("bancobrasil") ? "Banco do Brasil"
    : "Banco"

  const lancamentos =
    parseNubank(dadosLinhas) ??
    parseOFXLike(dadosLinhas) ??
    parseCreditoDebito(dadosLinhas)

  if (!lancamentos) return { lancamentos: [], banco, erro: "Formato de CSV não reconhecido. Verifique se o arquivo é um extrato bancário." }
  if (lancamentos.length === 0) return { lancamentos: [], banco, erro: "Nenhum lançamento encontrado no arquivo." }

  return { lancamentos, banco }
}
