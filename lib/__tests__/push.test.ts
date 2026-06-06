import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("web-push", () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock("@/lib/db", () => ({
  db: {
    pushSubscription: { findMany: vi.fn() },
    notificacaoPreferencia: { findUnique: vi.fn() },
  },
}))

import { sendPushToResponsavel } from "@/lib/push"
import { db } from "@/lib/db"
import webpush from "web-push"

const m = db as unknown as {
  pushSubscription: { findMany: ReturnType<typeof vi.fn> }
  notificacaoPreferencia: { findUnique: ReturnType<typeof vi.fn> }
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.VAPID_PUBLIC_KEY = "pub"
  process.env.VAPID_PRIVATE_KEY = "priv"
  process.env.VAPID_EMAIL = "mailto:t@t.com"
})

describe("sendPushToResponsavel", () => {
  it("envia quando tipo habilitado e tem subscriptions", async () => {
    m.notificacaoPreferencia.findUnique.mockResolvedValue({ vencimento: true })
    m.pushSubscription.findMany.mockResolvedValue([{ endpoint: "https://fcm/1", p256dh: "abc", auth: "xyz" }])
    await sendPushToResponsavel(1, "vencimento", { title: "Vence hoje", body: "R$ 200", url: "/responsavel" })
    expect(webpush.sendNotification).toHaveBeenCalledTimes(1)
  })

  it("nao envia quando tipo desabilitado", async () => {
    m.notificacaoPreferencia.findUnique.mockResolvedValue({ vencimento: false })
    m.pushSubscription.findMany.mockResolvedValue([{ endpoint: "https://fcm/1", p256dh: "abc", auth: "xyz" }])
    await sendPushToResponsavel(1, "vencimento", { title: "t", body: "b", url: "/" })
    expect(webpush.sendNotification).not.toHaveBeenCalled()
  })

  it("nao envia quando sem subscriptions", async () => {
    m.notificacaoPreferencia.findUnique.mockResolvedValue({ vencimento: true })
    m.pushSubscription.findMany.mockResolvedValue([])
    await sendPushToResponsavel(1, "vencimento", { title: "t", body: "b", url: "/" })
    expect(webpush.sendNotification).not.toHaveBeenCalled()
  })
})
