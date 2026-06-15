"use client"

import { useState, useTransition } from "react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { TriangleAlert, Loader2 } from "lucide-react"

interface ConfirmDialogProps {
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "danger" | "warning"
  onConfirm: () => void | Promise<void>
  children: React.ReactNode
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  onConfirm,
  children,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false)
  const [pending, startPending] = useTransition()

  function handleConfirm() {
    startPending(async () => {
      await onConfirm()
      setOpen(false)
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!pending) setOpen(o) }}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-danger-50">
            <TriangleAlert className="size-6 text-danger-600" />
          </div>
          <AlertDialogTitle className="text-center">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-center">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogCancel disabled={pending}>{cancelLabel}</AlertDialogCancel>
          <Button
            onClick={handleConfirm}
            disabled={pending}
            className={variant === "danger" ? "bg-danger-600 text-white hover:bg-danger-700" : "bg-warning-600 text-white hover:bg-warning-700"}
          >
            {pending ? <><Loader2 className="size-4 animate-spin" /> Aguarde...</> : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
