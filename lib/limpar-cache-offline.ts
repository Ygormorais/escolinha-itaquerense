/** Apaga o cache do service worker (logout): nada autenticado fica no aparelho. */
export async function limparCacheOffline(): Promise<void> {
  try {
    if (typeof caches !== "undefined") {
      const chaves = await caches.keys()
      await Promise.all(chaves.map((k) => caches.delete(k)))
    }
    if (typeof navigator !== "undefined" && navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "limpar-cache" })
    }
  } catch {
    // Cache Storage indisponível (modo restrito): nada a limpar.
  }
}
