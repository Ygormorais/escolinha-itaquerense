// v3 — estratégia NETWORK-FIRST.
// O v1 usava cache-first (`cached || fetch`), o que servia JS/HTML antigos
// indefinidamente e fazia mudanças no app não aparecerem (botões "sem efeito").
// Agora sempre buscamos da rede quando online; o cache é só fallback offline.
// v3: o catch nunca devolve undefined ao respondWith (causava
// "Failed to convert value to 'Response'" e falhas silenciosas em server actions).
// v4: cache SÓ de assets estáticos (allowlist). Páginas, RSC, /api e /uploads
// (dados pessoais e financeiros) nunca entram no cache; o logout limpa tudo.
const CACHE_NAME = "escolinha-v4"

const STATIC_ASSETS = [
  "/manifest.json",
  "/logo.png",
]

self.addEventListener("install", (event) => {
  // assume o controle imediatamente, sem esperar fechar as abas
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
  )
})

// Só arquivos estáticos versionados ou públicos; nunca navegação, /api nem /uploads.
function cacheavel(request, response) {
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return false
  if (request.mode === "navigate" || request.headers.get("RSC")) return false
  const permitido =
    url.pathname.startsWith("/_next/static/") ||
    STATIC_ASSETS.includes(url.pathname)
  if (!permitido) return false
  const cc = (response.headers.get("Cache-Control") || "").toLowerCase()
  return !cc.includes("no-store") && !cc.includes("private")
}

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "limpar-cache") {
    event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))))
  }
})

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === "basic" && cacheavel(event.request, response)) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      // offline (ou fetch rejeitado): cai para o cache; sem cache, devolve uma
      // Response válida — respondWith(undefined) lança "Failed to convert value to 'Response'".
      .catch(async () => {
        const cached = await caches.match(event.request)
        return (
          cached ??
          new Response("Sem conexão", {
            status: 503,
            statusText: "Service Unavailable",
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          })
        )
      })
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener("push", (event) => {
  if (!event.data) return
  const { title, body, icon, url } = event.data.json()
  event.waitUntil(
    self.registration.showNotification(title, { body, icon: icon ?? "/logo.png", badge: "/logo.png", data: { url } })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const url = event.notification.data?.url ?? "/responsavel"
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) return client.focus()
      }
      return clients.openWindow(url)
    })
  )
})
