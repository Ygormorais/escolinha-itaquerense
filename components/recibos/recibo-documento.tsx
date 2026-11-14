import { ShieldCheck } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import type { ClubConfig } from "@/lib/config"
import { formatMoney } from "@/lib/utils"

export type ReciboDocumentoDados = {
  numero: string
  alunoNome: string
  responsavel: string
  mesReferencia: string
  valor: number
  formaPagamento: string
  /** "dd/mm/aaaa" já formatado. */
  dataPagamento: string
  codigoVerificacao: string | null
}

/**
 * O recibo como sai no papel. Usado na prévia da emissão e na página de cada recibo.
 * `urlValidacao` só existe para recibo emitido; sem ela o bloco avisa que o código vem na emissão.
 */
export function ReciboDocumento({
  recibo,
  config,
  urlValidacao,
}: {
  recibo: ReciboDocumentoDados
  config: Pick<ClubConfig, "nome" | "endereco" | "cidade" | "telefone">
  urlValidacao: string | null
}) {
  const valor = formatMoney(recibo.valor || 0)
  return (
    <div id="recibo-print" className="superficie-clara w-full max-w-[680px] overflow-x-auto border border-border print:border-none">
      <div className="bg-brand-800 px-8 py-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">{config.nome}</h2>
            <p className="mt-0.5 text-sm text-white/80">Recibo de Pagamento — Escolinha de Futebol</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-white/80">Recibo Nº</p>
            <p className="whitespace-nowrap text-lg font-bold">{recibo.numero}</p>
          </div>
        </div>
      </div>

      <div className="bg-white px-8 py-6">
        <p className="mb-5 text-sm leading-6 text-foreground">
          Declaramos ter recebido de <strong>{recibo.responsavel || "—"}</strong> a quantia de <strong>{valor}</strong>, referente a{" "}
          <strong>{recibo.mesReferencia || "—"}</strong> do aluno <strong>{recibo.alunoNome || "—"}</strong>, dando quitação
          exclusivamente ao pagamento descrito neste recibo.
        </p>
        <dl className="divide-y divide-border">
          <Linha label="Aluno" value={recibo.alunoNome || "—"} />
          <Linha label="Responsável" value={recibo.responsavel || "—"} />
          <Linha label="Referência" value={recibo.mesReferencia || "—"} />
          <Linha label="Valor" value={valor} destaque />
          <Linha label="Forma de Pagamento" value={recibo.formaPagamento || "—"} />
          <Linha label="Data do Pagamento" value={recibo.dataPagamento || "—"} />
        </dl>

        <div className="mt-8 flex items-end justify-between gap-6 rounded-xl border border-brand-200 bg-brand-50 p-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-semibold text-brand-900">
              <ShieldCheck className="size-4" /> Recibo verificável
            </p>
            {recibo.codigoVerificacao ? (
              <>
                <p className="mt-1 text-xs text-muted-foreground">Confira a autenticidade e o status pelo QR code.</p>
                <p className="mt-2 break-all font-mono text-xs font-bold">Código: {recibo.codigoVerificacao}</p>
              </>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">O código de validação será criado ao emitir.</p>
            )}
          </div>
          {urlValidacao ? <QRCodeSVG value={urlValidacao} size={82} level="M" aria-label="QR code de validação do recibo" /> : null}
        </div>

        <div className="mt-10 grid grid-cols-2 gap-8">
          <Assinatura label="Assinatura do Responsável" />
          <Assinatura label="Assinatura do Clube" />
        </div>
      </div>

      <div className="border-t border-border bg-muted/30 px-8 py-3 text-center text-xs text-muted-foreground">
        {config.endereco}
        {config.cidade ? ` — ${config.cidade}` : ""}
        {config.telefone ? ` · ${config.telefone}` : ""}
      </div>
    </div>
  )
}

function Linha({ label, value, destaque = false }: { label: string; value: string; destaque?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={destaque ? "text-base font-bold text-brand-800" : "text-right text-sm font-medium text-foreground"}>{value}</dd>
    </div>
  )
}

function Assinatura({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-full border-t border-foreground/40" />
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

/** CSS de impressão: só o recibo vai para o papel. */
export const ESTILO_IMPRESSAO_RECIBO = `
  @media print {
    body * { visibility: hidden; }
    #recibo-print, #recibo-print * { visibility: visible; }
    #recibo-print { position: absolute; top: 0; left: 0; width: 100%; max-width: none; }
  }
`
