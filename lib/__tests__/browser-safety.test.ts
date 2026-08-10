import { afterEach, describe, expect, it, vi } from "vitest"
import {
  appendPrintElement,
  buildInternalHref,
  buildWhatsAppHref,
  openPrintDocument,
} from "@/lib/browser-safety"

type FakeElement = {
  tagName: string
  textContent: string
  className: string
  attributes: Record<string, string>
  children: FakeElement[]
  appendChild: (child: FakeElement) => FakeElement
  replaceChildren: (...children: FakeElement[]) => void
  setAttribute: (name: string, value: string) => void
}

function fakeElement(tagName: string): FakeElement {
  return {
    tagName,
    textContent: "",
    className: "",
    attributes: {},
    children: [],
    appendChild(child) {
      this.children.push(child)
      return child
    },
    replaceChildren(...children) {
      this.children = children
    },
    setAttribute(name, value) {
      this.attributes[name] = value
    },
  }
}

function fakePrintWindow() {
  const head = fakeElement("head")
  const body = fakeElement("body")
  const close = vi.fn()
  const print = vi.fn()
  const setTimeout = vi.fn((callback: () => void) => {
    callback()
    return 1
  })
  const document = {
    documentElement: { lang: "" },
    title: "",
    head,
    body,
    close,
    createElement: vi.fn((tagName: string) => fakeElement(tagName)),
  }
  const popup = { document, close, print, setTimeout, opener: {} as unknown }

  return { document, popup, print, setTimeout }
}

describe("browser-safety", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("normaliza o telefone e codifica a mensagem do WhatsApp", () => {
    const href = buildWhatsAppHref(
      "+55 (11) 95868-6579",
      "Olá! <script>alert('xss')</script>",
    )
    const url = new URL(href)

    expect(url.origin).toBe("https://wa.me")
    expect(url.pathname).toBe("/5511958686579")
    expect(url.searchParams.get("text")).toBe("Olá! <script>alert('xss')</script>")
    expect(href).not.toContain("<script>")
  })

  it("usa um número seguro quando a configuração é inválida", () => {
    expect(buildWhatsAppHref("javascript:alert(1)")).toBe("https://wa.me/5511999999999")
  })

  it("codifica parâmetros de rotas internas sem permitir URL relativa ao protocolo", () => {
    expect(buildInternalHref("/frequencia/scanner", { data: "2026-08-10&admin=true" }))
      .toBe("/frequencia/scanner?data=2026-08-10%26admin%3Dtrue")
    expect(() => buildInternalHref("//malicioso.example" as `/${string}`, { data: "x" }))
      .toThrow("O caminho interno não pode ser relativo ao protocolo")
  })

  it("insere dados de impressão como texto, sem reinterpretá-los como HTML", () => {
    const document = {
      createElement: vi.fn((tagName: string) => fakeElement(tagName)),
    } as unknown as Document
    const parent = fakeElement("body")
    const malicious = "<img src=x onerror=alert(1)>"

    const element = appendPrintElement(document, parent as unknown as Node, "p", {
      className: "observacao",
      text: malicious,
    })

    expect(element.textContent).toBe(malicious)
    expect(element.className).toBe("observacao")
    expect(parent.children).toHaveLength(1)
  })

  it("monta e imprime uma nova página somente com nós DOM", () => {
    const { document, popup, print, setTimeout } = fakePrintWindow()
    const open = vi.fn(() => popup)
    vi.stubGlobal("window", { open })

    const opened = openPrintDocument({
      title: "Contrato <script>",
      styles: "body { color: black; }",
      printDelayMs: 300,
      render(printDocument, body) {
        appendPrintElement(printDocument, body, "p", { text: "Aluno <img onerror=alert(1)>" })
      },
    })

    expect(opened).toBe(true)
    expect(open).toHaveBeenCalledWith("", "_blank")
    expect(popup.opener).toBeNull()
    expect(document.documentElement.lang).toBe("pt-BR")
    expect(document.title).toBe("Contrato <script>")
    expect(document.head.children.map((child) => child.tagName)).toEqual(["meta", "style"])
    expect(document.body.children[0].textContent).toBe("Aluno <img onerror=alert(1)>")
    expect(document.close).toHaveBeenCalledOnce()
    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 300)
    expect(print).toHaveBeenCalledOnce()
  })

  it("não tenta imprimir quando o navegador bloqueia a janela", () => {
    vi.stubGlobal("window", { open: vi.fn(() => null) })

    expect(openPrintDocument({ title: "Teste", styles: "", render: vi.fn() })).toBe(false)
  })

  it("aceita configuração de WhatsApp ausente sem gerar URL insegura", () => {
    expect(buildWhatsAppHref(undefined)).toBe("https://wa.me/5511999999999")
  })
})
