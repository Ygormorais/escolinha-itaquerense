import { getConfig } from "@/lib/config"
import { TEXTO_CONTATO, whatsappUrl } from "@/lib/site/whatsapp"
import { SiteHeader } from "./site-header"
import { SiteFooter } from "./site-footer"

interface Opcoes {
  /** true quando a página já está dentro de um .lp (o wrapper não repete a classe). */
  dentroDaLanding?: boolean
}

/** Cabeçalho do site para páginas server: lê o WhatsApp das configurações do clube. */
export function SiteTopo({ dentroDaLanding = false }: Opcoes = {}) {
  const config = getConfig()
  return <SiteHeader whatsappUrl={whatsappUrl(config.whatsapp, TEXTO_CONTATO)} dentroDaLanding={dentroDaLanding} />
}

/** Rodapé do site para páginas server: contato e WhatsApp vêm das configurações. */
export function SiteRodape({ dentroDaLanding = false }: Opcoes = {}) {
  const config = getConfig()
  return (
    <SiteFooter
      whatsapp={config.whatsapp}
      endereco={config.endereco}
      cidade={config.cidade}
      dentroDaLanding={dentroDaLanding}
    />
  )
}
