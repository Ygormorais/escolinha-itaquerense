"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CheckCircle, AlertCircle, Camera, Loader2, QrCode, RefreshCw, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { registrarPresencaQr } from "@/app/actions/frequencia-qr"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { mensagemPermissaoCamera } from "@/lib/camera-guidance"

type ScanResult = { ok: boolean; alunoNome?: string; jaRegistrado?: boolean; erro?: string; pendente?: boolean } | null
type RegistroPendente = { alunoId: string; h: string; data: string; criadoEm: string }

const FILA_OFFLINE_KEY = "escolinha:frequencia:scanner-offline:v1"

function lerFilaOffline(): RegistroPendente[] {
  try {
    const valor = JSON.parse(localStorage.getItem(FILA_OFFLINE_KEY) ?? "[]")
    return Array.isArray(valor) ? valor : []
  } catch {
    return []
  }
}

function gravarFilaOffline(fila: RegistroPendente[]) {
  localStorage.setItem(FILA_OFFLINE_KEY, JSON.stringify(fila))
}

export default function ScannerPage() {
  const searchParams = useSearchParams()
  const dataParam = searchParams.get("data") ?? format(new Date(), "yyyy-MM-dd")
  const [resultado, setResultado] = useState<ScanResult>(null)
  const [ativo, setAtivo] = useState(false)
  const [iniciando, setIniciando] = useState(false)
  const [processandoFoto, setProcessandoFoto] = useState(false)
  const [pendentes, setPendentes] = useState(0)
  const [sincronizando, setSincronizando] = useState(false)
  const scannerRef = useRef<unknown>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fotoInputRef = useRef<HTMLInputElement>(null)

  function enfileirar(alunoId: string, h: string) {
    const fila = lerFilaOffline()
    const registro = { alunoId, h, data: dataParam, criadoEm: new Date().toISOString() }
    const semDuplicata = fila.filter((item) => !(item.alunoId === alunoId && item.data === dataParam))
    const novaFila = [...semDuplicata, registro]
    gravarFilaOffline(novaFila)
    setPendentes(novaFila.length)
    setResultado({ ok: true, pendente: true })
  }

  async function sincronizarFila() {
    if (!navigator.onLine || sincronizando) return
    const fila = lerFilaOffline()
    if (fila.length === 0) return
    setSincronizando(true)
    const restantes: RegistroPendente[] = []
    let sincronizados = 0
    for (const item of fila) {
      try {
        const resposta = await registrarPresencaQr(item.alunoId, item.h, item.data)
        if (resposta.ok) {
          sincronizados++
        } else if (/aguarde/i.test(resposta.erro)) {
          restantes.push(item)
        }
        // QR inválido ou aluno removido é descartado para não bloquear a fila.
      } catch {
        restantes.push(item)
      }
    }
    gravarFilaOffline(restantes)
    setPendentes(restantes.length)
    setSincronizando(false)
    if (sincronizados > 0) {
      setResultado({ ok: true, alunoNome: `${sincronizados} presença${sincronizados === 1 ? "" : "s"}`, jaRegistrado: false })
    }
  }

  async function processarQr(decodedText: string) {
    try {
      const url = new URL(decodedText)
      const id = url.pathname.split("/")[2]
      const h = url.searchParams.get("h") ?? ""
      if (!id || !h) throw new Error("QR sem matrícula")
      if (!navigator.onLine) {
        enfileirar(id, h)
        return
      }
      try {
        const res = await registrarPresencaQr(id, h, dataParam)
        setResultado(res)
      } catch {
        enfileirar(id, h)
      }
    } catch {
      setResultado({ ok: false, erro: "QR inválido" })
    }
  }

  // Distingue "nenhuma câmera no aparelho" de "há câmera, mas o navegador não
  // conseguiu acessá-la" sem assumir que o usuário está no Windows.
  async function mensagemSemCamera(): Promise<string> {
    let videoCount = 0
    try {
      const devs = await navigator.mediaDevices?.enumerateDevices?.()
      videoCount = (devs ?? []).filter((d) => d.kind === "videoinput").length
    } catch { /* ignora */ }
    return videoCount > 0
      ? `Câmera detectada, mas o navegador não conseguiu acessá-la. ${mensagemPermissaoCamera(navigator.userAgent)}`
      : "Nenhuma câmera encontrada. Ative a câmera do aparelho ou use “Lançar presença manualmente”."
  }

  async function iniciarScanner() {
    setResultado(null)
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setResultado({ ok: false, erro: "A câmera exige conexão segura (HTTPS). Acesse por https:// ou localhost." })
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setResultado({ ok: false, erro: "Este navegador não oferece acesso à câmera. Abra a página no Safari ou Chrome atualizado." })
      return
    }
    setIniciando(true)
    try {
      const { Html5Qrcode } = await import("html5-qrcode")
      // O html5-qrcode mede o contêiner antes de criar o vídeo. Aguarda o React
      // remover `display:none`; sem isso o leitor nasce com largura zero no mobile.
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      })
      const scanner = new Html5Qrcode("qr-reader")
      scannerRef.current = scanner
      const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      let camera: string | MediaTrackConstraints
      if (mobile) {
        // No celular, prefere a traseira sem exigir que ela exista.
        camera = { facingMode: { ideal: "environment" } }
      } else {
        // Browsers desktop (especialmente no Windows) são mais confiáveis ao
        // abrir a webcam pelo deviceId do que por facingMode.
        const cameras = await Html5Qrcode.getCameras()
        if (cameras.length === 0) throw new DOMException("No camera found", "NotFoundError")
        const preferida = cameras.find(({ label }) => /integrated|webcam|front|facetime/i.test(label)) ?? cameras[0]
        camera = preferida.id
      }
      await scanner.start(
        camera,
        {
          fps: 10,
          qrbox: (width, height) => {
            const size = Math.max(120, Math.floor(Math.min(width, height) * 0.72))
            return { width: size, height: size }
          },
        },
        async (decodedText: string) => {
          await scanner.pause(true)
          await processarQr(decodedText)
          timeoutRef.current = setTimeout(() => { setResultado(null); scanner.resume() }, 2000)
        },
        undefined
      )
      setAtivo(true)
    } catch (e) {
      setAtivo(false)
      const scanner = scannerRef.current as { stop?: () => Promise<void>; clear?: () => void } | null
      try { await scanner?.stop?.() } catch { /* a inicialização não chegou ao estado ativo */ }
      try { scanner?.clear?.() } catch { /* o contêiner pode já estar limpo */ }
      scannerRef.current = null
      // O html5-qrcode às vezes embrulha o DOMException, então olhamos name E mensagem.
      const nome = e instanceof Error ? e.name : ""
      const mensagemOriginal = e instanceof Error ? e.message : String(e)
      const msg = mensagemOriginal.toLowerCase()
      console.error("Falha ao iniciar o scanner de câmera", {
        name: nome || "UnknownError",
        message: mensagemOriginal,
        secureContext: window.isSecureContext,
      })
      if (nome === "NotAllowedError" || nome === "PermissionDeniedError" || /not\s?allowed|permission|denied|negad/.test(msg)) {
        setResultado({ ok: false, erro: mensagemPermissaoCamera(navigator.userAgent) })
      } else if (nome === "NotReadableError" || nome === "TrackStartError" || nome === "AbortError" || /not\s?readable|in use|track\s?start|could not start video|starting video failed/.test(msg)) {
        setResultado({ ok: false, erro: "A câmera está em uso por outro aplicativo. Feche os outros apps e tente de novo." })
      } else if (nome === "NotFoundError" || nome === "OverconstrainedError" || nome === "DevicesNotFoundError" || /not\s?found|no camera|overconstrained|requested device/.test(msg)) {
        setResultado({ ok: false, erro: await mensagemSemCamera() })
      } else {
        const detalhe = process.env.NODE_ENV === "development" && mensagemOriginal
          ? ` Detalhe técnico: ${mensagemOriginal.slice(0, 180)}`
          : ""
        setResultado({ ok: false, erro: `Não foi possível iniciar a câmera. Verifique as permissões e tente novamente.${detalhe}` })
      }
    } finally {
      setIniciando(false)
    }
  }

  async function lerQrDaFoto(event: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0]
    if (!arquivo) return
    setResultado(null)
    setProcessandoFoto(true)
    try {
      const { Html5Qrcode } = await import("html5-qrcode")
      const leitor = new Html5Qrcode("qr-reader-file")
      try {
        const decodedText = await leitor.scanFile(arquivo, false)
        await processarQr(decodedText)
      } finally {
        try { leitor.clear() } catch { /* leitor já encerrado */ }
      }
    } catch {
      setResultado({ ok: false, erro: "Não foi possível ler um QR Code nesta imagem. Tente aproximar e manter o código bem iluminado." })
    } finally {
      event.target.value = ""
      setProcessandoFoto(false)
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

  useEffect(() => {
    const aoVoltarConexao = () => void sincronizarFila()
    window.addEventListener("online", aoVoltarConexao)
    const inicializacao = window.setTimeout(() => {
      setPendentes(lerFilaOffline().length)
      if (navigator.onLine) void sincronizarFila()
    }, 0)
    return () => {
      window.clearTimeout(inicializacao)
      window.removeEventListener("online", aoVoltarConexao)
      pararScanner()
    }
    // A fila pertence ao dispositivo e é reconciliada ao abrir a tela.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dataFormatada = format(new Date(dataParam + "T12:00:00"), "EEEE, dd/MM/yyyy", { locale: ptBR }).replace(/^./, (c) => c.toUpperCase())

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-5 px-4 py-5 sm:gap-6 sm:p-6">
      <div className="text-center">
        <h1 className="font-heading text-2xl font-bold leading-tight sm:text-3xl">Scanner de Presença</h1>
        <p className="text-sm text-muted-foreground">{dataFormatada}</p>
      </div>
      {/* O alvo precisa estar visível antes de `start`; html5-qrcode mede sua largura. */}
      <div id="qr-reader" className={ativo || iniciando ? "min-h-[280px] w-full overflow-hidden rounded-xl border bg-black" : "hidden"} />
      <div id="qr-reader-file" className="hidden" aria-hidden />
      {!ativo && !iniciando && (
        <div className="flex min-h-[280px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 text-center text-muted-foreground">
          <QrCode className="size-10 opacity-40" />
          <p className="text-sm">Toque em “Iniciar Scanner” para ler o QR Code.</p>
        </div>
      )}
      {resultado && (
        <div
          role={resultado.ok ? "status" : "alert"}
          aria-live="polite"
          className={`flex w-full items-center gap-3 rounded-xl p-4 text-white ${resultado.ok ? "bg-success-600" : "bg-danger-600"}`}
        >
          {resultado.ok ? <CheckCircle className="size-6 shrink-0" /> : <AlertCircle className="size-6 shrink-0" />}
          <div>
            {resultado.ok ? (
              resultado.pendente ? (
                <><p className="font-bold">Leitura salva no aparelho</p><p className="text-sm opacity-90">Será sincronizada quando a conexão voltar.</p></>
              ) : (
                <><p className="font-bold">{resultado.alunoNome}</p><p className="text-sm opacity-90">{resultado.jaRegistrado ? "Já estava presente" : "✓ Presença registrada"}</p></>
              )
            ) : (
              <p className="font-bold">{resultado.erro}</p>
            )}
          </div>
        </div>
      )}
      {pendentes > 0 && (
        <div className="flex w-full flex-col gap-3 rounded-xl border border-warning-200 bg-warning-50 p-4 text-warning-900" role="status">
          <div className="flex items-start gap-3">
            <WifiOff className="mt-0.5 size-5 shrink-0" aria-hidden />
            <div>
              <p className="font-semibold">{pendentes} leitura{pendentes === 1 ? "" : "s"} aguardando sincronização</p>
              <p className="text-xs opacity-80">A fila fica salva neste aparelho até o servidor confirmar.</p>
            </div>
          </div>
          <Button type="button" size="sm" variant="outline" disabled={sincronizando} onClick={() => void sincronizarFila()}>
            <RefreshCw className={`size-4 ${sincronizando ? "animate-spin" : ""}`} aria-hidden />
            {sincronizando ? "Sincronizando..." : "Sincronizar agora"}
          </Button>
        </div>
      )}
      {!ativo ? (
        <div className="flex w-full flex-col gap-2">
          <Button onClick={iniciarScanner} className="w-full gap-2" disabled={iniciando}>
            {iniciando ? <Loader2 className="size-4 animate-spin" /> : <QrCode className="size-4" />}
            {iniciando ? "Abrindo câmera..." : "Iniciar Scanner"}
          </Button>
          <input
            ref={fotoInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            aria-label="Selecionar foto do QR Code"
            onChange={lerQrDaFoto}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            disabled={iniciando || processandoFoto}
            onClick={() => fotoInputRef.current?.click()}
          >
            {processandoFoto ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
            {processandoFoto ? "Lendo foto..." : "Ler QR por foto"}
          </Button>
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
