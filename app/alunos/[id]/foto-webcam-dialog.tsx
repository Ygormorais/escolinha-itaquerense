"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Camera, Loader2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { mensagemPermissaoCamera } from "@/lib/camera-guidance"
import { recorteRetrato34, tamanhoSaida } from "@/lib/foto-webcam"

function mensagemErro(e: unknown): string {
  const nome = e instanceof DOMException ? e.name : ""
  if (nome === "NotAllowedError" || nome === "SecurityError") return mensagemPermissaoCamera(navigator.userAgent)
  if (nome === "NotFoundError" || nome === "OverconstrainedError") return "Nenhuma câmera encontrada neste computador."
  if (nome === "NotReadableError") return "A câmera está em uso por outro aplicativo. Feche-o e tente de novo."
  return "Não foi possível abrir a câmera."
}

/** Abre a webcam, mostra o vídeo e devolve um JPEG 3×4 já recortado. */
export function FotoWebcamDialog({
  open,
  onOpenChange,
  onCapturar,
  enviando,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCapturar: (arquivo: File) => void
  enviando: boolean
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [pronta, setPronta] = useState(false)
  const [captura, setCaptura] = useState<{ arquivo: File; url: string } | null>(null)

  const pararCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  // liga a câmera enquanto o diálogo está aberto e sem foto capturada; desliga ao fechar
  const ligada = open && !captura
  useEffect(() => {
    if (!ligada) return
    let cancelado = false

    async function iniciar() {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setErro("A câmera exige conexão segura (HTTPS) ou localhost e um navegador atualizado.")
        return
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
        if (cancelado) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        setErro(null)
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          await video.play().catch(() => undefined)
        }
      } catch (e) {
        if (!cancelado) setErro(mensagemErro(e))
      }
    }

    void iniciar()
    return () => {
      cancelado = true
      setPronta(false)
      pararCamera()
    }
  }, [ligada, pararCamera])

  // libera a URL da pré-visualização quando a captura some
  useEffect(() => {
    return () => {
      if (captura) URL.revokeObjectURL(captura.url)
    }
  }, [captura])

  function fechar(valor: boolean) {
    if (enviando) return
    if (!valor) {
      setCaptura(null)
      setErro(null)
    }
    onOpenChange(valor)
  }

  function tirarFoto() {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const recorte = recorteRetrato34(video.videoWidth, video.videoHeight)
    const { largura, altura } = tamanhoSaida(recorte)
    const canvas = document.createElement("canvas")
    canvas.width = largura
    canvas.height = altura
    const ctx = canvas.getContext("2d")
    if (!ctx) { setErro("Não foi possível capturar a imagem."); return }
    ctx.drawImage(video, recorte.sx, recorte.sy, recorte.sw, recorte.sh, 0, 0, largura, altura)
    canvas.toBlob(
      (blob) => {
        if (!blob) { setErro("Não foi possível capturar a imagem."); return }
        const arquivo = new File([blob], "foto-webcam.jpg", { type: "image/jpeg" })
        setCaptura({ arquivo, url: URL.createObjectURL(blob) })
      },
      "image/jpeg",
      0.9,
    )
  }

  return (
    <Dialog open={open} onOpenChange={fechar}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tirar foto do aluno</DialogTitle>
        </DialogHeader>

        <div className="flex justify-center py-2">
          <div className="relative aspect-[3/4] w-56 overflow-hidden rounded-xl border-2 border-border bg-muted">
            {captura ? (
              // eslint-disable-next-line @next/next/no-img-element -- pré-visualização local (blob:)
              <img src={captura.url} alt="Foto capturada" className="size-full object-cover" />
            ) : (
              <>
                {/* espelhado só na tela, para parecer um espelho; a foto salva não é espelhada */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  onPlaying={() => setPronta(true)}
                  aria-label="Imagem da webcam"
                  className="size-full scale-x-[-1] object-cover"
                />
                {!pronta && !erro && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {erro && (
          <p role="alert" className="text-sm text-danger-600">
            {erro}
          </p>
        )}

        <DialogFooter>
          {captura ? (
            <>
              <Button type="button" variant="outline" onClick={() => setCaptura(null)} disabled={enviando}>
                <RotateCcw className="size-4" /> Tirar outra
              </Button>
              <Button type="button" onClick={() => onCapturar(captura.arquivo)} disabled={enviando}>
                {enviando && <Loader2 className="size-4 animate-spin" />} Usar esta foto
              </Button>
            </>
          ) : (
            <Button type="button" onClick={tirarFoto} disabled={!pronta || Boolean(erro)}>
              <Camera className="size-4" /> Tirar foto
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
