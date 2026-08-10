const DEFAULT_WHATSAPP_NUMBER = "5511999999999"

export function buildWhatsAppHref(number?: string | null, message?: string): string {
  const digits = (number ?? "").replace(/\D/g, "")
  const safeNumber = /^[1-9]\d{7,14}$/.test(digits) ? digits : DEFAULT_WHATSAPP_NUMBER
  const encodedNumber = encodeURIComponent(safeNumber)
  const encodedMessage = message ? `?text=${encodeURIComponent(message)}` : ""

  return `https://wa.me/${encodedNumber}${encodedMessage}`
}

export function buildInternalHref(pathname: `/${string}`, params: Record<string, string>): string {
  if (pathname.startsWith("//")) {
    throw new Error("O caminho interno não pode ser relativo ao protocolo")
  }

  const query = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&")

  return query ? `${pathname}?${query}` : pathname
}

type PrintElementOptions = {
  className?: string
  text?: string
}

export function appendPrintElement<K extends keyof HTMLElementTagNameMap>(
  document: Document,
  parent: Node,
  tagName: K,
  options: PrintElementOptions = {},
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName)

  if (options.className) element.className = options.className
  if (options.text !== undefined) element.textContent = options.text

  parent.appendChild(element)
  return element
}

type OpenPrintDocumentOptions = {
  title: string
  styles: string
  render: (document: Document, body: HTMLElement) => void
  printDelayMs?: number
}

export function openPrintDocument({
  title,
  styles,
  render,
  printDelayMs = 0,
}: OpenPrintDocumentOptions): boolean {
  const printWindow = window.open("", "_blank")
  if (!printWindow) return false
  printWindow.opener = null

  const { document } = printWindow
  document.documentElement.lang = "pt-BR"

  const charset = document.createElement("meta")
  charset.setAttribute("charset", "UTF-8")
  const style = document.createElement("style")
  style.textContent = styles

  document.head.replaceChildren(charset, style)
  document.title = title
  document.body.replaceChildren()
  render(document, document.body)
  document.close()

  if (printDelayMs > 0) {
    printWindow.setTimeout(() => printWindow.print(), printDelayMs)
  } else {
    printWindow.print()
  }

  return true
}
