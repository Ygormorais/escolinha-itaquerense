"use client"

import { useState, useEffect } from "react"
import { QRCodeSVG } from "qrcode.react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Download, Printer, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"

export function QrCodeClient({ turmas }: { turmas: string[] }) {
  const [turma, setTurma] = useState(turmas[0] ?? "")
  const [data, setData] = useState(format(new Date(), "yyyy-MM-dd"))
  const [baseUrl, setBaseUrl] = useState("")

  useEffect(() => {
    setBaseUrl(window.location.origin)
  }, [])

  const token = `${turma}:${data}`
  const url = baseUrl ? `${baseUrl}/checkin?token=${encodeURIComponent(token)}` : ""
  const dataLabel = data ? format(new Date(data + "T12:00:00"), "EEEE, dd 'de' MMMM", { locale: ptBR }) : ""

  function handlePrint() {
    window.print()
  }

  function handleDownload() {
    const svg = document.querySelector("#qr-svg svg")
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([svgData], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `qrcode-${turma}-${data}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6 lg:p-8">
      <div className="w-full max-w-md space-y-4">
        <h1 className="font-heading text-xl font-semibold">QR Code de Presença</h1>
        <p className="text-sm text-muted-foreground">
          Projete ou imprima o QR Code para que os alunos registrem a própria presença.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Turma</label>
            <Select value={turma} onValueChange={(v) => v && setTurma(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {turmas.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Data</label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        {url && (
          <div id="qr-svg" className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center print:border-0 print:p-0">
            <QRCodeSVG
              value={url}
              size={240}
              level="M"
              includeMargin
            />
            <div>
              <p className="font-heading text-lg font-bold">{turma}</p>
              <p className="text-sm capitalize text-muted-foreground">{dataLabel}</p>
            </div>
            <p className="text-xs text-muted-foreground">Aponte a câmera para registrar sua presença</p>
          </div>
        )}

        <div className="flex gap-2 print:hidden">
          <Button variant="outline" onClick={handlePrint} className="flex-1">
            <Printer className="size-4" /> Imprimir
          </Button>
          <Button variant="outline" onClick={handleDownload} className="flex-1">
            <Download className="size-4" /> Baixar SVG
          </Button>
          <Button variant="outline" size="icon" onClick={() => setData(format(new Date(), "yyyy-MM-dd"))}>
            <RefreshCw className="size-4" />
          </Button>
        </div>

        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs font-medium text-muted-foreground">URL gerada:</p>
          <p className="mt-1 break-all font-mono text-[10px] text-foreground">{url}</p>
        </div>
      </div>
    </div>
  )
}
