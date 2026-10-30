import { describe, expect, it, vi } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import type { ClubConfig } from "@/lib/config"

vi.mock("next/navigation", () => ({
  // URL adulterada: dados diferentes do recibo salvo.
  useSearchParams: () => new URLSearchParams("aluno=NOME%20ALTERADO&valor=999&codigo=COD9"),
  useRouter: () => ({ refresh: vi.fn() }),
}))
vi.mock("@/app/actions/recibos", () => ({ salvarRecibo: vi.fn(), cancelarRecibo: vi.fn() }))

import RecibosForm from "@/app/recibos/recibos-form"

const config = { nome: "E.C. Itaquerense", endereco: "", telefone: "", cidade: "", cnpj: "" } as unknown as ClubConfig

const reciboSalvo = {
  id: 3,
  numero: "REC-2026-AB",
  alunoNome: "Ana Souza",
  responsavel: "Marta Souza",
  mesReferencia: "2026-06",
  valor: 120,
  formaPagamento: "PIX",
  dataPagamento: new Date("2026-06-10T12:00:00"),
  createdAt: new Date("2026-06-10T12:00:00"),
  codigoVerificacao: "COD9",
  canceladoAt: null,
}

describe("impressão de recibo já emitido", () => {
  it("mostra os dados salvos, não os da URL, com os campos travados", () => {
    const html = renderToStaticMarkup(<RecibosForm recibos={[]} config={config} reciboSalvo={reciboSalvo} />)
    expect(html).toContain("Ana Souza")
    expect(html).toContain("Marta Souza")
    expect(html).toContain("REC-2026-AB")
    expect(html).not.toContain("NOME ALTERADO")
    expect(html).toMatch(/id="rec-aluno"[^>]*readonly/i)
    expect(html).toMatch(/id="rec-valor"[^>]*readonly/i)
  })

  it("sem recibo salvo, o código da URL não liga o modo só-imprimir", () => {
    const html = renderToStaticMarkup(<RecibosForm recibos={[]} config={config} reciboSalvo={null} />)
    expect(html).not.toMatch(/id="rec-aluno"[^>]*readonly/i)
  })
})
