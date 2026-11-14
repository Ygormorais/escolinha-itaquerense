import { describe, expect, it, vi } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import type { ClubConfig } from "@/lib/config"

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("aluno=Ana%20Souza&valor=120&codigo=COD9"),
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}))
vi.mock("@/app/actions/recibos", () => ({ salvarRecibo: vi.fn(), cancelarRecibo: vi.fn() }))

import RecibosForm from "@/app/recibos/recibos-form"

const config = { nome: "E.C. Itaquerense", endereco: "", telefone: "", cidade: "", cnpj: "" } as unknown as ClubConfig

const recibo = {
  id: 3,
  numero: "REC-2026-AB",
  alunoNome: "Bruno Lima",
  responsavel: "Marta Lima",
  mesReferencia: "2026-06",
  valor: 120,
  formaPagamento: "PIX",
  dataPagamento: new Date("2026-06-10T12:00:00"),
  createdAt: new Date("2026-06-10T12:00:00"),
  codigoVerificacao: "COD9",
  canceladoAt: null,
}

describe("tela de recibos", () => {
  it("pré-preenche a emissão pela URL e mostra a prévia sem QR", () => {
    const html = renderToStaticMarkup(<RecibosForm recibos={[]} config={config} />)
    expect(html).toMatch(/id="rec-aluno"[^>]*value="Ana Souza"/)
    expect(html).not.toMatch(/id="rec-aluno"[^>]*readonly/i)
    expect(html).toContain("Emitir e imprimir")
    expect(html).not.toContain("QR code de validação")
  })

  it("cada recibo do histórico abre a própria página", () => {
    const html = renderToStaticMarkup(<RecibosForm recibos={[recibo]} config={config} />)
    expect(html).toContain('href="/recibos/3"')
    expect(html).toContain("Ver e imprimir")
    expect(html).not.toContain("Re-imprimir")
  })
})
