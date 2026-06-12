"use client"

import { Printer } from "lucide-react"
import { Button } from "./button"

interface PrintButtonProps {
  onPrint?: () => void
  label?: string
}

export function PrintButton({ onPrint, label = "Imprimir PDF" }: PrintButtonProps) {
  return (
    <Button variant="outline" onClick={onPrint ?? (() => window.print())}>
      <Printer className="size-4" />
      {label}
    </Button>
  )
}
