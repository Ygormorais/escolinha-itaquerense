const MAPA_TURMA: Record<string, string> = {
  "Sub-7": "bg-info-50 text-info-600",
  "Sub-9": "bg-success-50 text-success-600",
  "Sub-11": "bg-warning-50 text-warning-600",
  "Sub-13": "bg-brand-100 text-brand-800",
  "Sub-15": "bg-danger-50 text-danger-600",
  "Sub-17": "bg-info-50 text-info-600",
}

export function corDaTurma(turma: string): string {
  return MAPA_TURMA[turma] ?? "bg-muted text-muted-foreground"
}
