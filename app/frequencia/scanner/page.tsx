"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle, AlertCircle, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { registrarPresencaQr } from "@/app/actions/frequencia-qr"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

type ScanResult = { ok: boolean; alunoNome?: string; jaRegistrado?: boolean; erro?: string } | null

export default function ScannerPage() {
  const searchParams = useSearchParams()
  const dataParam = searchParams.get("data") ?? format(new Date(), "yyyy-MM-dd")
  const [resultado, setResultado] = useState<ScanResult>(null)
  const [ativo, setAtivo] = useState(false)
  const scannerRef = useRef<unknown>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function iniciarScanner() {
    setResultado(null)
    try {
      const { Html5Qrcode } = await import("html5-qrcode")
      const scanner = new Html5Qrcode("qr-reader")
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText: string) => {
          await scanner.pause(true)
          try {
            const url = new URL(decodedText)
            const id = url.pathname.split("/")[2]
            const h = url.searchParams.get("h") ?? ""
            const res = await registrarPresencaQr(id, h, dataParam)
            setResultado(res)
            timeoutRef.current = setTimeout(() => { setResultado(null); scanner.resume() }, 2000)
          } catch {
            setResultado({ ok: false, erro: "QR inválido" })
            setTimeout(() => { setResultado(null); scanner.resume() }, 2000)
          }
        },
        undefined
      )
      setAtivo(true)
    } catch (e) {
      setAtivo(false)
      const nome = e instanceof Error ? e.name : ""
      const erro =
        typeof window !== "undefined" && !window.isSecureContext
          ? "A câmera exige conexão segura (HTTPS). Acesse o site por https://."
          : nome === "NotFoundError" || nome === "OverconstrainedError" || nome === "DevicesNotFoundError"
            ? "Nenhuma câmera encontrada neste dispositivo."
            : nome === "NotAllowedError" || nome === "PermissionDeniedError"
              ? "Permissão de câmera negada. Libere o acesso nas configurações do navegador e tente de novo."
              : nome === "NotReadableError" || nome === "TrackStartError"
                ? "A câmera está em uso por outro aplicativo."
                : "Não foi possível iniciar a câmera. Verifique as permissões e tente novamente."
      setResultado({ ok: false, erro })
    }
  }

  function pararScanner() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    ;(scannerRef.current as { stop?: () => Promise<void> })?.stop?.().catch(() => {})
    setAtivo(false)
  }

  useEffect(() => () => { pararScanner() }, [])

  const dataFormatada = format(new Date(dataParam + "T12:00:00"), "EEEE, dd/MM/yyyy", { locale: ptBR })

  return (
    <div className="flex flex-col items-center gap-6 p-6 max-w-md mx-auto">
      <div className="text-center">
        <h1 className="font-heading text-2xl font-bold">Scanner de Presença</h1>
        <p className="text-sm text-muted-foreground capitalize">{dataFormatada}</p>
      </div>
      <div id="qr-reader" className="w-full rounded-xl overflow-hidden border" style={{ minHeight: 280 }} />
      {resultado && (
        <div className={`w-full rounded-xl p-4 flex items-center gap-3 text-white ${resultado.ok ? "bg-success-600" : "bg-danger-600"}`}>
          {resultado.ok ? <CheckCircle className="size-6 shrink-0" /> : <AlertCircle className="size-6 shrink-0" />}
          <div>
            {resultado.ok ? (
              <><p className="font-bold">{resultado.alunoNome}</p><p className="text-sm opacity-90">{resultado.jaRegistrado ? "Já estava presente" : "✓ Presença registrada"}</p></>
            ) : (
              <p className="font-bold">{resultado.erro}</p>
            )}
          </div>
        </div>
      )}
      {!ativo ? (
        <Button onClick={iniciarScanner} className="w-full gap-2"><QrCode className="size-4" /> Iniciar Scanner</Button>
      ) : (
        <Button variant="outline" onClick={pararScanner} className="w-full">Parar Scanner</Button>
      )}
    </div>
  )
}
