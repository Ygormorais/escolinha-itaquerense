import { describe, expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { AnuncioBanner } from "@/components/site/anuncio-banner"

const WA = "https://wa.me/5511958686579?text=Quero%20anunciar"

describe("AnuncioBanner sem anúncio ativo", () => {
  it("oferece o espaço com link para contratar pelo WhatsApp", () => {
    const html = renderToStaticMarkup(<AnuncioBanner anuncio={null} contratarUrl={WA} />)
    expect(html).toContain("Anuncie aqui")
    expect(html).toContain("Espaço aberto para patrocinadores")
    expect(html).toContain("Seja patrocinador")
    expect(html).toContain(`href="${WA}"`)
    expect(html).toContain('target="_blank"')
  })

  it("não mostra nada quando não há como contratar", () => {
    expect(renderToStaticMarkup(<AnuncioBanner anuncio={null} />)).toBe("")
  })

  it("com anúncio ativo, mostra o anúncio e não a oferta", () => {
    const html = renderToStaticMarkup(
      <AnuncioBanner
        anuncio={{ id: 7, titulo: "Padaria", anunciante: "Padaria do Bairro", imagemUrl: "/a.png", imagemMobileUrl: null }}
        contratarUrl={WA}
      />,
    )
    expect(html).toContain("/api/anuncio/7")
    expect(html).not.toContain("Anuncie aqui")
  })
})
