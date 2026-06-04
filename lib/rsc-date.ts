/** Campo de data vindo de Server Component (serializado) ou Prisma no servidor. */
export type RscDate = Date | string

export function toDate(value: RscDate): Date {
  return value instanceof Date ? value : new Date(value)
}
