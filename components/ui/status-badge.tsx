import { Badge, badgeVariants } from "@/components/ui/badge"
import type { VariantProps } from "class-variance-authority"

type StatusType = "Ativo" | "Inativo" | "Pago" | "Pendente" | "Vencido" | "Presente" | "Ausente" | "Justificado"

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"]

const statusConfig: Record<StatusType, { label: string; variant: BadgeVariant }> = {
  Ativo:       { label: "Ativo",       variant: "success" },
  Inativo:     { label: "Inativo",     variant: "secondary" },
  Pago:        { label: "Pago",        variant: "success" },
  Pendente:    { label: "Pendente",    variant: "warning" },
  Vencido:     { label: "Vencido",     variant: "destructive" },
  Presente:    { label: "Presente",    variant: "success" },
  Ausente:     { label: "Ausente",     variant: "destructive" },
  Justificado: { label: "Justificado", variant: "info" },
}

interface StatusBadgeProps {
  status: StatusType
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, variant: "secondary" as const }
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}
