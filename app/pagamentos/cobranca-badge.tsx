const STYLES: Record<string, string> = {
  pendente: "bg-muted text-muted-foreground",
  pago: "bg-success-50 text-success-600",
  vencido: "bg-danger-50 text-danger-600",
  cancelado: "bg-warning-50 text-warning-600",
}

const LABELS: Record<string, string> = {
  pendente: "Aguardando",
  pago: "Pago MP",
  vencido: "Vencido",
  cancelado: "Cancelado",
}

export function CobrancaBadge({ status }: { status: string | null }) {
  if (!status) return null
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status] ?? ""}`}>
      {LABELS[status] ?? status}
    </span>
  )
}
