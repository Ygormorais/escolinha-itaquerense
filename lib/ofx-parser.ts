export type OFXTransaction = {
  fitid: string
  date: Date
  amount: number
  memo: string
}

function extractTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}>([^<]+)`, "i"))
  return match ? match[1].trim() : ""
}

function parseOFXDate(raw: string): Date {
  const year = parseInt(raw.slice(0, 4), 10)
  const month = parseInt(raw.slice(4, 6), 10) - 1
  const day = parseInt(raw.slice(6, 8), 10)
  return new Date(year, month, day)
}

export function parseOFX(content: string): OFXTransaction[] {
  const blockRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi
  const blocks = [...content.matchAll(blockRegex)]

  const transactions: OFXTransaction[] = []

  for (const [, block] of blocks) {
    const amount = parseFloat(extractTag(block, "TRNAMT"))
    if (!amount || amount <= 0) continue

    transactions.push({
      fitid: extractTag(block, "FITID"),
      date: parseOFXDate(extractTag(block, "DTPOSTED")),
      amount,
      memo: extractTag(block, "MEMO"),
    })
  }

  if (transactions.length === 0) {
    throw new Error("Nenhuma transação encontrada no arquivo OFX")
  }

  return transactions
}
