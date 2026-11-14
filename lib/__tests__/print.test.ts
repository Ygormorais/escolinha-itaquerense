import { describe, it, expect } from "vitest"
import { buildPrintDocument, html } from "@/lib/print"

const PAYLOAD = '<img src=x onerror="alert(1)">'

describe("lib/print — html", () => {
  it("escapa valores interpolados", () => {
    const corpo = html`<h1>${PAYLOAD}</h1>`
    expect(corpo.value).toBe("<h1>&lt;img src=x onerror=&quot;alert(1)&quot;&gt;</h1>")
  })

  it("não escapa de novo trechos e listas criados com html", () => {
    const linhas = ["a", "<b>"].map((n) => html`<tr><td>${n}</td></tr>`)
    const corpo = html`<tbody>${linhas}</tbody>`
    expect(corpo.value).toBe("<tbody><tr><td>a</td></tr><tr><td>&lt;b&gt;</td></tr></tbody>")
  })

  it("trata null e undefined como vazio e mantém números", () => {
    expect(html`${null}|${undefined}|${42}`.value).toBe("||42")
  })
})

describe("lib/print — buildPrintDocument", () => {
  it("escapa o título e não deixa script do usuário no documento", () => {
    const doc = buildPrintDocument(html`<p>${PAYLOAD}</p>`, `Histórico — </title><script>alert(1)</script>`)
    expect(doc).toContain("<title>Histórico — &lt;/title&gt;&lt;script&gt;alert(1)&lt;/script&gt;</title>")
    expect(doc).not.toContain("<img")
    // Único script é o window.print() do próprio template.
    expect(doc.match(/<script>/g)).toHaveLength(1)
  })
})
