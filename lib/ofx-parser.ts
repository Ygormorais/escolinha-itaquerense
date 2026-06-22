export type OFXTransaction = {
  fitid: string
  date: Date
  amount: number
  memo: string
}

function extractTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}>([^<\r\n]+)`, "i"))
  return match ? match[1].trim() : ""
}

function parseOFXDate(raw: string): Date {
  // yyyymmddHHmmss ou yyyymmdd
  const year = parseInt(raw.slice(0, 4), 10)
  const month = parseInt(raw.slice(4, 6), 10) - 1
  const day = parseInt(raw.slice(6, 8), 10)
  return new Date(year, month, day)
}

function extractBlocks(content: string): string[] {
  // Formato XML: <STMTTRN>...</STMTTRN>
  const xmlBlocks = [...content.matchAll(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi)]
  if (xmlBlocks.length > 0) return xmlBlocks.map(([, b]) => b)

  // Formato SGML (bancos brasileiros): <STMTTRN> sem fechamento
  // Delimitado por próximo <STMTTRN> ou por tags de fechamento de bloco pai
  const sgmlBlocks: string[] = []
  const starts = [...content.matchAll(/<STMTTRN>/gi)]
  for (let i = 0; i < starts.length; i++) {
    const from = starts[i].index! + starts[i][0].length
    const to = i + 1 < starts.length
      ? starts[i + 1].index!
      : content.search(/<\/BANKTRANLIST>|<\/STMTRS>|<\/OFX>/i)
    const block = to > from ? content.slice(from, to) : content.slice(from)
    sgmlBlocks.push(block)
  }
  return sgmlBlocks
}

export function parseOFX(content: string): OFXTransaction[] {
  const blocks = extractBlocks(content)
  const transactions: OFXTransaction[] = []

  for (const block of blocks) {
    const amountRaw = extractTag(block, "TRNAMT").replace(",", ".")
    const amount = parseFloat(amountRaw)
    if (!isFinite(amount) || amount <= 0) continue

    const dateRaw = extractTag(block, "DTPOSTED")
    if (!dateRaw) continue

    const fitid = extractTag(block, "FITID") || String(Math.random())
    const memo = extractTag(block, "MEMO") || extractTag(block, "NAME") || ""

    transactions.push({ fitid, date: parseOFXDate(dateRaw), amount, memo })
  }

  if (transactions.length === 0) {
    throw new Error(
      "Nenhuma transação encontrada. Verifique se o arquivo é um extrato OFX válido e contém lançamentos a crédito."
    )
  }

  return transactions
}
