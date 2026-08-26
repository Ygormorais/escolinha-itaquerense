const DASHBOARD_MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/

export type DashboardMonthParam = string | string[] | undefined

export function currentDashboardMonth(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

/** Normaliza o filtro recebido pela URL antes de usá-lo em datas e consultas. */
export function normalizeDashboardMonth(
  value: DashboardMonthParam,
  now = new Date(),
): string {
  const rawValue = Array.isArray(value) ? value[0] : value
  if (!rawValue) return currentDashboardMonth(now)

  const match = DASHBOARD_MONTH_PATTERN.exec(rawValue)
  if (!match) return currentDashboardMonth(now)

  const year = Number(match[1])
  if (year < 2020 || year > 2099) return currentDashboardMonth(now)

  return rawValue
}
