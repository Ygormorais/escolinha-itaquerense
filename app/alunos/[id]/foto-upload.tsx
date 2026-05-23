"use client"

import { useRef, useState, useTransition } from "react"
import { Camera, Loader2, Trash2 } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { db } from "@/lib/db"

async function removerFoto(alunoId: number) {
  await fetch(`/api/upload/foto?alunoId=${alunoId}`, { method: "DELETE" })
}

export function FotoUpload({
  alunoId,
  fotoAtual,
}: {
  alunoId: number
  fotoAtual: string | null
}) {
  const [preview, setPreview] = useState<string | null>(fotoAtual)
  const [uploading, setUploading] = useState(false)
  const [removing, startRemoving] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append("foto", file)
    formData.append("alunoId", String(alunoId))

    try {
      const res = await fetch("/api/upload/foto", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setPreview(data.url + "?t=" + Date.now())
      toast.success("Foto atualizada")
      router.refresh()
    } catch {
      toast.error("Erro ao enviar foto")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
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

        <label className="absolute -bottom-2 -right-2 flex size-8 cursor-pointer items-center justify-center rounded-full border border-border bg-card shadow-sm hover:bg-muted transition-colors">
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
          <button
            onClick={handleRemover}
            disabled={removing}
            className="flex items-center gap-1 text-xs text-danger-600 hover:underline"
          >
            <Trash2 className="size-3" />
            Remover
          </button>
        )}
      </div>
    </div>
  )
}
