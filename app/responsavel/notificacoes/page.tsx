"use client"
import { useEffect, useState, useTransition } from "react"
import { Bell, Loader2 } from "lucide-react"
import { PortalHero } from "@/components/responsavel/portal-hero"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const TIPOS = [
  { key: "vencimento", label: "Mensalidade vencendo", desc: "3 dias antes do vencimento" },
  { key: "pagamentoConfirmado", label: "Pagamento confirmado", desc: "Quando o Mercado Pago confirmar" },
  { key: "falta", label: "Aluno faltou", desc: "Quando registrarem falta no treino" },
  { key: "convocacao", label: "Convocação para jogo", desc: "Quando criarem uma partida" },
  { key: "comunicado", label: "Comunicado novo", desc: "Quando a escola enviar avisos" },
  { key: "avaliacao", label: "Boletim publicado", desc: "Quando uma avaliação for cadastrada ou atualizada" },
] as const

type Prefs = Record<string, boolean>

function urlBase64ToArrayBuffer(value: string): ArrayBuffer {
  const padding = "=".repeat((4 - (value.length % 4)) % 4)
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = window.atob(base64)
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) {
    bytes[i] = raw.charCodeAt(i)
  }
  return bytes.buffer as ArrayBuffer
}

export default function NotificacoesPage() {
  const [prefs, setPrefs] = useState<Prefs>({ vencimento: true, pagamentoConfirmado: true, falta: false, convocacao: true, comunicado: true, avaliacao: true })
  const [ativo, setAtivo] = useState(() =>
    typeof Notification !== "undefined" && Notification.permission === "granted"
  )
  const [salvando, startSalvando] = useTransition()

  useEffect(() => {
    fetch("/api/push/preferencias").then((r) => r.json()).then(setPrefs).catch(() => {})
  }, [])

  async function ativarNotificacoes() {
    const perm = await Notification.requestPermission()
    if (perm !== "granted") { toast.error("Permissão negada"); return }
    const reg = await navigator.serviceWorker.ready
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) { toast.error("Chave VAPID não configurada"); return }
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToArrayBuffer(vapidKey),
    })
    const subJson = sub.toJSON()
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ endpoint: sub.endpoint, keys: subJson.keys }),
    })
    setAtivo(true)
    toast.success("Notificações ativadas!")
  }

  function salvarPreferencias() {
    startSalvando(async () => {
      await fetch("/api/push/preferencias", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(prefs) })
      toast.success("Preferências salvas")
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <PortalHero
        backHref="/responsavel"
        icon={Bell}
        title="Notificações"
        description="Escolha o que deseja receber no celular"
      />
      {!ativo && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-sm">Notificações desativadas</p>
            <p className="text-xs text-muted-foreground">Ative para receber alertas no celular</p>
          </div>
          <Button size="sm" onClick={ativarNotificacoes} className="bg-brand-800 text-white hover:bg-brand-900 shrink-0">Ativar</Button>
        </div>
      )}
      <div className="flex flex-col gap-3">
        {TIPOS.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between rounded-xl border p-4">
            <div><p className="font-medium text-sm">{label}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
            <Switch checked={!!prefs[key]} onCheckedChange={(v) => setPrefs((p) => ({ ...p, [key]: v }))} disabled={!ativo} />
          </div>
        ))}
      </div>
      <Button onClick={salvarPreferencias} disabled={salvando || !ativo} className="w-full">
        {salvando ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : "Salvar preferências"}
      </Button>
    </div>
  )
}
