/**
 * Diferencia falha de conexão (vale guardar no aparelho e tentar depois) de erro do servidor,
 * como sessão expirada ou sem permissão, que não some sozinho.
 */
export function ehErroDeRede(e: unknown, online: boolean = typeof navigator === "undefined" ? true : navigator.onLine): boolean {
  if (!online) return true
  // Requisição recusada ou sem rede: TypeError ("Failed to fetch", "NetworkError...", "Load failed" no Safari).
  return e instanceof TypeError && /fetch|network|load failed/i.test(e.message)
}
