const FORMATOS: Array<{
  nome: string
  detecta: (linhas: string[][]) => boolean
  parse: (row: string[]) => {
    dataTransacao: Date
    valor: number
    parcelas: number
    bandeira: string
    tipo: string
    nomeNoCartao: string
    parcela: string
    autorizacao?: string
    nsu?: string
    custoTaxa?: number
    valorLiquido?: number
    previsao?: Date
  } | null
}> = [
  {
    nome: "Stone",
    detecta: (linhas) => {
      const h = linhas[0]?.map((c) => c.toLowerCase().trim()) ?? []
      return h.some((c) => c.includes("stone")) || h.includes("data da venda")
    },
    parse: (row) => {
      if (row.length < 5) return null
      const data = parseDateBR(row[0])
      if (!data) return null
      return {
        dataTransacao: data,
        valor: parseFloat(row[4]?.replace("R$", "").replace(".", "").replace(",", ".").trim() || "0"),
        parcelas: parseInt(row[3] || "1"),
        bandeira: row[2] || "",
        tipo: (row[1] || "").toLowerCase().includes("débito") ? "debito" : "credito",
        nomeNoCartao: row[5] || "",
        parcela: row[3] || "",
        autorizacao: row[6],
        nsu: row[7],
        custoTaxa: parseFloat(row[8]?.replace("R$", "").replace(".", "").replace(",", ".").trim() || "0") || undefined,
        valorLiquido: parseFloat(row[9]?.replace("R$", "").replace(".", "").replace(",", ".").trim() || "0") || undefined,
      }
    },
  },
  {
    nome: "Rede",
    detecta: (linhas) => {
      const h = linhas[0]?.map((c) => c.toLowerCase().trim()) ?? []
      return h.includes("rede") || (h.includes("bandeira") && h.includes("parcelas"))
    },
    parse: (row) => {
      if (row.length < 4) return null
      const data = parseDateBR(row[0])
      if (!data) return null
      return {
        dataTransacao: data,
        valor: parseFloat(row[3]?.replace("R$", "").replace(".", "").replace(",", ".").trim() || "0"),
        parcelas: parseInt(row[2] || "1"),
        bandeira: row[1] || "",
        tipo: "credito",
        nomeNoCartao: row[4] || "",
        parcela: row[2] || "",
        autorizacao: row[5],
        nsu: row[6],
      }
    },
  },
  {
    nome: "Cielo",
    detecta: (linhas) => {
      const h = linhas[0]?.map((c) => c.toLowerCase().trim()) ?? []
      return h.includes("cielo") || h.includes("data da transação")
    },
    parse: (row) => {
      if (row.length < 4) return null
      const data = parseDateBR(row[0])
      if (!data) return null
      return {
        dataTransacao: data,
        valor: parseFloat(row[3]?.replace("R$", "").replace(".", "").replace(",", ".").trim() || "0"),
        parcelas: parseInt(row[2] || "1"),
        bandeira: row[1] || "",
        tipo: (row[1] || "").toLowerCase().includes("débito") ? "debito" : "credito",
        nomeNoCartao: row[4] || "",
        parcela: row[2] || "",
        autorizacao: row[5],
        nsu: row[6],
      }
    },
  },
  {
    nome: "PagSeguro",
    detecta: (linhas) => {
      const h = linhas[0]?.map((c) => c.toLowerCase().trim()) ?? []
      return h.includes("pagseguro") || h.includes("data da venda")
    },
    parse: (row) => {
      if (row.length < 5) return null
      const data = parseDateBR(row[0])
      if (!data) return null
      return {
        dataTransacao: data,
        valor: parseFloat(row[4]?.replace("R$", "").replace(".", "").replace(",", ".").trim() || "0"),
        parcelas: parseInt(row[3] || "1"),
        bandeira: row[2] || "",
        tipo: (row[1] || "").toLowerCase().includes("débito") ? "debito" : "credito",
        nomeNoCartao: row[5] || "",
        parcela: row[3] || "",
      }
    },
  },
  {
    nome: "Genérico",
    detecta: () => true,
    parse: (row) => {
      if (row.length < 2) return null
      const data = parseDateBR(row[0]) || parseDateISO(row[0])
      if (!data) return null
      const valor = parseFloat(row[1]?.replace("R$", "").replace(".", "").replace(",", ".").trim() || "0")
      if (!valor || isNaN(valor)) return null
      return {
        dataTransacao: data,
        valor,
        parcelas: 1,
        bandeira: row[2] || "",
        tipo: "credito",
        nomeNoCartao: row[3] || "",
        parcela: "",
      }
    },
  },
]

function parseDateBR(str: string): Date | null {
  const m = str.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
  return null
}

function parseDateISO(str: string): Date | null {
  const m = str.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return null
}

export function detectarFormato(linhas: string[][]): string {
  for (const fmt of FORMATOS) {
    if (fmt.detecta(linhas)) return fmt.nome
  }
  return "Genérico"
}

export function parseCSV(texto: string): { cabecalho: string[]; linhas: string[][] } {
  const lines = texto.split("\n").filter((l) => l.trim())
  const cabecalho = lines[0].split(";").map((c) => c.replace(/^"|"$/g, "").trim())
  const linhas = lines.slice(1)
    .filter((l) => l.trim())
    .map((l) => l.split(";").map((c) => c.replace(/^"|"$/g, "").trim()))
    .filter((l) => l.length >= 2 && l.some((c) => c))
  return { cabecalho, linhas }
}

export function parseTransacoes(linhas: string[][]): Array<{
  dataTransacao: Date
  valor: number
  parcelas: number
  bandeira: string
  tipo: string
  nomeNoCartao: string
  parcela: string
  autorizacao?: string
  nsu?: string
  custoTaxa?: number
  valorLiquido?: number
  previsao?: Date
  linha: number
}> {
  const formato = detectarFormato(linhas)
  const parser = FORMATOS.find((f) => f.nome === formato) ?? FORMATOS[FORMATOS.length - 1]
  const resultado: Array<{
    dataTransacao: Date
    valor: number
    parcelas: number
    bandeira: string
    tipo: string
    nomeNoCartao: string
    parcela: string
    autorizacao?: string
    nsu?: string
    custoTaxa?: number
    valorLiquido?: number
    previsao?: Date
    linha: number
  }> = []

  for (let i = 0; i < linhas.length; i++) {
    const parsed = parser.parse(linhas[i])
    if (parsed) {
      resultado.push({ ...parsed, linha: i + 2 })
    }
  }

  return resultado
}
