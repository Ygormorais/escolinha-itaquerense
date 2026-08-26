type FrequencyCount = {
  presenca: string
  _count: { _all: number }
}

type GroupedPaymentCount = {
  _count: { _all: number }
}

export function summarizeFrequency(rows: FrequencyCount[]) {
  const total = rows.reduce((sum, row) => sum + row._count._all, 0)
  const present = rows.find((row) => row.presenca === "Presente")?._count._all ?? 0

  return {
    present,
    total,
    percentage: total > 0 ? Math.round((present / total) * 100) : 0,
  }
}

export function summarizeOverduePayments(rows: GroupedPaymentCount[]) {
  return {
    payments: rows.reduce((sum, row) => sum + row._count._all, 0),
    students: rows.length,
  }
}
