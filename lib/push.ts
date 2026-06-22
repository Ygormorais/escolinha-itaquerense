import webpush from "web-push"
import { db } from "@/lib/db"

type TipoNotificacao = "vencimento" | "pagamentoConfirmado" | "falta" | "convocacao" | "comunicado" | "avaliacao"

function setup() {
  const pub = process.env.VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  const email = process.env.VAPID_EMAIL ?? "mailto:admin@escolinha.com"
  if (pub && priv) webpush.setVapidDetails(email, pub, priv)
}

export async function sendPushToResponsavel(
  responsavelId: number,
  tipo: TipoNotificacao,
  payload: { title: string; body: string; url: string }
): Promise<void> {
  setup()
  const [prefs, subs] = await Promise.all([
    db.notificacaoPreferencia.findUnique({ where: { responsavelId } }),
    db.pushSubscription.findMany({ where: { responsavelId } }),
  ])
  const defaults: Record<TipoNotificacao, boolean> = {
    vencimento: true, pagamentoConfirmado: true, falta: false, convocacao: true, comunicado: true, avaliacao: true,
  }
  const habilitado = prefs ? !!(prefs as Record<string, unknown>)[tipo] : defaults[tipo]
  if (!habilitado || subs.length === 0) return
  const notification = JSON.stringify({ title: payload.title, body: payload.body, icon: "/logo.png", url: payload.url })
  await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        notification
      ).catch(() => null)
    )
  )
}
