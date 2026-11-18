import { describe, expect, it } from "vitest"
import { descricaoCurta, hrefNoticia, linkWhatsApp, paragrafos, videoYoutubeId } from "@/lib/noticias/conteudo"
import { jsonLdSeguro, noticiaJsonLd } from "@/lib/noticias/json-ld"

describe("paragrafos", () => {
  it("separa por linha em branco e junta quebras simples", () => {
    expect(paragrafos("Primeiro\ncontinua.\r\n\r\n\n  Segundo.  \n\n\n")).toEqual(["Primeiro continua.", "Segundo."])
  })
  it("vazio ou nulo dá lista vazia", () => {
    expect(paragrafos(null)).toEqual([])
    expect(paragrafos("  \n\n ")).toEqual([])
  })
})

describe("descricaoCurta", () => {
  it("prefere o subtítulo, senão o primeiro parágrafo", () => {
    expect(descricaoCurta("Sub", "Corpo")).toBe("Sub")
    expect(descricaoCurta(null, "Corpo\n\nOutro")).toBe("Corpo")
    expect(descricaoCurta("", null)).toBe("")
  })
  it("corta em palavra inteira com reticências", () => {
    const d = descricaoCurta(null, "palavra ".repeat(40), 50)
    expect(d.length).toBeLessThanOrEqual(50)
    expect(d.endsWith("…")).toBe(true)
  })
})

describe("videoYoutubeId", () => {
  it("aceita watch, youtu.be e shorts", () => {
    expect(videoYoutubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ")
    expect(videoYoutubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ")
    expect(videoYoutubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ")
  })
  it("ignora link de outro site, vazio ou nulo", () => {
    expect(videoYoutubeId("https://vimeo.com/123456")).toBeNull()
    expect(videoYoutubeId("")).toBeNull()
    expect(videoYoutubeId(null)).toBeNull()
  })
})

describe("hrefNoticia e linkWhatsApp", () => {
  it("monta o caminho da página ou cai na listagem", () => {
    expect(hrefNoticia("vitoria")).toBe("/noticias/publico/vitoria")
    expect(hrefNoticia(null)).toBe("/noticias/publico")
    expect(hrefNoticia(undefined)).toBe("/noticias/publico")
  })
  it("codifica título e URL no texto do WhatsApp", () => {
    const l = linkWhatsApp("Vitória & festa", "https://site.test/noticias/publico/a")
    expect(l.startsWith("https://wa.me/?text=")).toBe(true)
    expect(decodeURIComponent(l.split("text=")[1])).toBe("Vitória & festa\nhttps://site.test/noticias/publico/a")
  })
})

describe("noticiaJsonLd", () => {
  const base = {
    titulo: "Vitória", descricao: "Resumo", url: "https://s.test/n/a", imagem: "https://s.test/i.png",
    publicadaEm: new Date("2026-11-01T10:00:00Z"), atualizadaEm: new Date("2026-11-02T10:00:00Z"),
    categoria: "Resultado", clube: "E.C. Itaquerense", logoUrl: "https://s.test/logo.png",
  }
  it("gera NewsArticle com datas ISO e publisher", () => {
    const j = noticiaJsonLd(base)
    expect(j["@type"]).toBe("NewsArticle")
    expect(j.datePublished).toBe("2026-11-01T10:00:00.000Z")
    expect(j.dateModified).toBe("2026-11-02T10:00:00.000Z")
    expect(j.publisher.name).toBe("E.C. Itaquerense")
    expect(j.mainEntityOfPage["@id"]).toBe(base.url)
  })
  it("escapa < para não fechar a tag script", () => {
    const s = jsonLdSeguro(noticiaJsonLd({ ...base, titulo: "</script><b>x" }))
    expect(s).not.toContain("</script>")
    expect(JSON.parse(s).headline).toBe("</script><b>x")
  })
})
