// v2 — estratégia NETWORK-FIRST.
// O v1 usava cache-first (`cached || fetch`), o que servia JS/HTML antigos
// indefinidamente e fazia mudanças no app não aparecerem (botões "sem efeito").
// Agora sempre buscamos da rede quando online; o cache é só fallback offline.
const CACHE_NAME = "escolinha-v2"

const STATIC_ASSETS = [
  "/login",
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

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      // offline: cai para o que estiver em cache
      .catch(() => caches.match(event.request))
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
