"use client"

import { PrinterIcon } from "lucide-react"
import { Button } from "./button"

interface PrintButtonProps {
  onPrint: () => void
  label?: string
}

export function PrintButton({ onPrint, label = "Imprimir / PDF" }: PrintButtonProps) {
  return (
    <Button variant="outline" onClick={onPrint}>
      <PrinterIcon className="size-4" />
      {label}
    </Button>
  )
}
