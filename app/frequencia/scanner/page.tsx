"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
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

  // Distingue "nenhuma webcam no aparelho" de "tem webcam mas o acesso está
  // bloqueado" (no Windows: Configurações › Privacidade › Câmera desligado).
  async function mensagemSemCamera(): Promise<string> {
    let videoCount = 0
    try {
      const devs = await navigator.mediaDevices?.enumerateDevices?.()
      videoCount = (devs ?? []).filter((d) => d.kind === "videoinput").length
    } catch { /* ignora */ }
    return videoCount > 0
      ? "Câmera detectada, mas o navegador não conseguiu acessá-la. Libere o acesso (cadeado na barra de endereço) e, no Windows, ative Configurações › Privacidade › Câmera."
      : "Nenhuma câmera encontrada. Conecte/ative uma webcam ou use “Lançar presença manualmente”."
  }

  async function iniciarScanner() {
    setResultado(null)
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setResultado({ ok: false, erro: "A câmera exige conexão segura (HTTPS). Acesse por https:// ou localhost." })
      return
    }
    try {
      const { Html5Qrcode } = await import("html5-qrcode")
      // Pede a câmera mais permissiva PRIMEIRO: força o prompt de permissão e
      // "acorda" o dispositivo. Sem isso, alguns navegadores retornam 0 câmeras
      // porque a permissão nunca foi solicitada. Liberamos o stream em seguida —
      // o html5-qrcode reabre a câmera ao iniciar.
      const probe = await navigator.mediaDevices.getUserMedia({ video: true })
      probe.getTracks().forEach((t) => t.stop())
      // Lista as câmeras e escolhe a traseira se houver, senão a frontal.
      // (Pedir { facingMode: "environment" } direto falha em notebooks que só
      // têm webcam frontal, como se não houvesse câmera.)
      const cameras = await Html5Qrcode.getCameras()
      if (!cameras || cameras.length === 0) {
        setResultado({ ok: false, erro: await mensagemSemCamera() })
        return
      }
      const traseira = cameras.find((c) => /back|rear|environment|traseira/i.test(c.label))
      const cameraId = (traseira ?? cameras[cameras.length - 1]).id
      const scanner = new Html5Qrcode("qr-reader")
      scannerRef.current = scanner
      await scanner.start(
        cameraId,
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
      // O html5-qrcode às vezes embrulha o DOMException, então olhamos name E mensagem.
      const nome = e instanceof Error ? e.name : ""
      const msg = (e instanceof Error ? e.message : String(e)).toLowerCase()
      if (nome === "NotAllowedError" || nome === "PermissionDeniedError" || /not\s?allowed|permission|denied|negad/.test(msg)) {
        setResultado({ ok: false, erro: "Permissão de câmera negada. Libere o acesso (cadeado na barra de endereço) e, no Windows, ative Configurações › Privacidade › Câmera." })
      } else if (nome === "NotReadableError" || nome === "TrackStartError" || /not\s?readable|in use|track\s?start/.test(msg)) {
        setResultado({ ok: false, erro: "A câmera está em uso por outro aplicativo. Feche os outros apps e tente de novo." })
      } else if (nome === "NotFoundError" || nome === "OverconstrainedError" || nome === "DevicesNotFoundError" || /not\s?found|no camera|overconstrained|requested device/.test(msg)) {
        setResultado({ ok: false, erro: await mensagemSemCamera() })
      } else {
        setResultado({ ok: false, erro: "Não foi possível iniciar a câmera. Verifique as permissões e tente novamente." })
      }
    }
  }

  function pararScanner() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    const s = scannerRef.current as { stop?: () => Promise<void>; getState?: () => number } | null
    try {
      // só para se estiver escaneando/pausado (2=SCANNING, 3=PAUSED); senão o
      // html5-qrcode lança "Cannot stop, scanner is not running or paused" (síncrono).
      const estado = s?.getState?.()
      if (s?.stop && (estado === 2 || estado === 3)) {
        s.stop().catch(() => {})
      }
    } catch {
      /* ignora — scanner não estava ativo */
    }
    setAtivo(false)
  }

  useEffect(() => () => { pararScanner() }, [])

  const dataFormatada = format(new Date(dataParam + "T12:00:00"), "EEEE, dd/MM/yyyy", { locale: ptBR }).replace(/^./, (c) => c.toUpperCase())

  return (
    <div className="flex flex-col items-center gap-6 p-6 max-w-md mx-auto">
      <div className="text-center">
        <h1 className="font-heading text-2xl font-bold">Scanner de Presença</h1>
        <p className="text-sm text-muted-foreground">{dataFormatada}</p>
      </div>
      {/* alvo de montagem do html5-qrcode (precisa existir no DOM); só mostra borda quando ativo */}
      <div id="qr-reader" className={ativo ? "w-full overflow-hidden rounded-xl border" : "hidden"} />
      {!ativo && (
        <div className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-muted-foreground" style={{ minHeight: 280 }}>
          <QrCode className="size-10 opacity-40" />
          <p className="text-sm">Toque em “Iniciar Scanner” para ler o QR Code.</p>
        </div>
      )}
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
        <div className="flex w-full flex-col gap-2">
          <Button onClick={iniciarScanner} className="w-full gap-2"><QrCode className="size-4" /> Iniciar Scanner</Button>
          {/* Sem câmera (ex.: desktop) dá pra marcar presença pela aba Registro */}
          <Link href="/frequencia" className="w-full">
            <Button variant="outline" className="w-full">Lançar presença manualmente</Button>
          </Link>
        </div>
      ) : (
        <Button variant="outline" onClick={pararScanner} className="w-full">Parar Scanner</Button>
      )}
    </div>
  )
}
