import { getConfig } from "@/lib/config"
import { TEXTO_CONTATO, whatsappUrl } from "@/lib/site/whatsapp"
import { SiteHeader } from "./site-header"
import { SiteFooter } from "./site-footer"

/** Cabeçalho do site para páginas server: lê o WhatsApp das configurações do clube. */
export function SiteTopo() {
  const config = getConfig()
  return <SiteHeader whatsappUrl={whatsappUrl(config.whatsapp, TEXTO_CONTATO)} />
}

/** Rodapé do site para páginas server: contato e WhatsApp vêm das configurações. */
export function SiteRodape() {
  const config = getConfig()
  return <SiteFooter whatsapp={config.whatsapp} endereco={config.endereco} cidade={config.cidade} />
}
