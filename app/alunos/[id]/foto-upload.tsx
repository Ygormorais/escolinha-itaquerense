"use client"

import { useRef, useState, useTransition } from "react"
import { Camera, Loader2, Trash2 } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

export function FotoUpload({
  alunoId,
  fotoAtual,
}: {
  alunoId: number
  fotoAtual: string | null
}) {
  const [preview, setPreview] = useState<string | null>(fotoAtual)
  const [uploading, startUploading] = useTransition()
  const [removing, startRemoving] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (inputRef.current) inputRef.current.value = ""

    const formData = new FormData()
    formData.append("foto", file)
    formData.append("alunoId", String(alunoId))

    startUploading(async () => {
      try {
        const res = await fetch("/api/upload/foto", { method: "POST", body: formData })
        const data = await res.json()
        if (!res.ok) { toast.error(data.error); return }
        setPreview(data.url + "?t=" + Date.now())
        toast.success("Foto atualizada")
        router.refresh()
      } catch {
        toast.error("Erro ao enviar foto")
      }
    })
  }

  function handleRemover() {
    startRemoving(async () => {
      const res = await fetch(`/api/upload/foto?alunoId=${alunoId}`, { method: "DELETE" })
      if (res.ok) {
        setPreview(null)
        toast.success("Foto removida")
        router.refresh()
      }
    })
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div className="size-28 overflow-hidden rounded-xl border-2 border-border bg-muted flex items-center justify-center">
          {preview ? (
            <Image
              src={preview}
              alt="Foto do aluno"
              width={112}
              height={112}
              className="object-cover w-full h-full"
              unoptimized
            />
          ) : (
            <Camera className="size-10 text-muted-foreground/40" />
          )}
          {(uploading || removing) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
              <Loader2 className="size-6 text-white animate-spin" />
            </div>
          )}
        </div>

        <label
          aria-label="Alterar foto do aluno"
          className="absolute -bottom-2 -right-2 flex size-8 cursor-pointer items-center justify-center rounded-full border border-border bg-card shadow-sm hover:bg-muted transition-colors"
        >
          <Camera className="size-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFile}
            className="hidden"
          />
        </label>
      </div>

      <div className="flex flex-col items-center gap-1">
        <p className="text-xs text-muted-foreground">Foto 3×4</p>
        {preview && (
          <ConfirmDialog
            title="Remover foto?"
            description="A foto do aluno será excluída permanentemente."
            confirmLabel="Remover"
            variant="danger"
            onConfirm={handleRemover}
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={removing}
              className="h-auto gap-1 p-0 text-xs text-danger-600 hover:text-danger-700 hover:bg-transparent"
            >
              <Trash2 className="size-3" />
              Remover
            </Button>
          </ConfirmDialog>
        )}
      </div>
    </div>
  )
}
