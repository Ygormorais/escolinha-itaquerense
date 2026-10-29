/** Local (`/…`) serve direto; externo passa pelo proxy anti-hotlink. Versão client-safe de viaProxyEscudo. */
export function viaProxyEscudoCliente(url: string): string {
  return url.startsWith("/") ? url : `/api/escudo?u=${encodeURIComponent(url)}`
}
