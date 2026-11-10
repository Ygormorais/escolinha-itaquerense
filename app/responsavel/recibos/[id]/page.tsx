import Link from "next/link"
import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, ShieldCheck } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { db } from "@/lib/db"
import { getConfig } from "@/lib/config"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { PrintButton } from "@/components/ui/print-button"
import { formatMoney } from "@/lib/utils"

export const metadata = { title: "Recibo — Escolinha Itaquerense" }

/** Recibo de uma baixa, aberto pela família no portal. Só o responsável do aluno vê. */
export default async function ReciboResponsavelPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getResponsavelSession()
  if (!session.authenticated || session.responsavelId == null) redirect("/responsavel/login")

  const { id: idRaw } = await params
  const id = Number(idRaw)
  if (!Number.isInteger(id) || id <= 0) notFound()

  const recibo = await db.recibo.findUnique({
    where: { id },
    select: {
      numero: true, codigoVerificacao: true, alunoNome: true, responsavel: true, mesReferencia: true,
      valor: true, formaPagamento: true, dataPagamento: true, canceladoAt: true, createdAt: true,
      aluno: { select: { responsavelId: true } },
      pagamento: { select: { aluno: { select: { responsavelId: true } } } },
    },
  })
  const dono = recibo?.aluno?.responsavelId ?? recibo?.pagamento?.aluno.responsavelId ?? null
  if (!recibo || dono !== session.responsavelId) notFound()

  const config = getConfig()
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host")
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https")
  const urlValidacao = recibo.codigoVerificacao && host ? `${proto}://${host}/validar-recibo/${recibo.codigoVerificacao}` : null

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/responsavel/mensalidades" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-ink-700)] hover:text-brand-700">
          <ArrowLeft className="size-4" /> Voltar às mensalidades
        </Link>
        {!recibo.canceladoAt && <PrintButton label="Imprimir ou salvar PDF" />}
      </div>

      <article className="mx-auto w-full max-w-2xl overflow-hidden rounded-[var(--radius-panel)] border border-border bg-white text-black print:border-0">
        <header className="border-b-4 border-b-[var(--red,#C62828)] bg-[#0B0B0B] px-6 py-5 text-white print:bg-white print:text-black">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70 print:text-black/60">{config.nome}</p>
          <div className="mt-1 flex items-baseline justify-between gap-4">
            <h1 className="font-heading text-2xl font-extrabold uppercase tracking-[-0.01em]">Recibo</h1>
            <span className="font-mono text-sm">Nº {recibo.numero}</span>
          </div>
        </header>

        {recibo.canceladoAt && (
          <p role="alert" className="border-b border-danger-600/25 bg-danger-50 px-6 py-3 text-sm font-semibold text-danger-600">
            Este recibo foi cancelado pela escolinha e não vale como comprovante.
          </p>
        )}

        <div className="px-6 py-6">
          <p className="text-sm leading-6">
            Recebemos de <strong>{recibo.responsavel}</strong> o valor de{" "}
            <strong>{formatMoney(recibo.valor)}</strong>, referente à mensalidade de{" "}
            <strong>{recibo.alunoNome}</strong> ({recibo.mesReferencia}).
          </p>

          <dl className="mt-6 divide-y divide-border border-y border-border text-sm">
            <Linha label="Aluno" value={recibo.alunoNome} />
            <Linha label="Responsável" value={recibo.responsavel} />
            <Linha label="Referência" value={recibo.mesReferencia} />
            <Linha label="Valor" value={formatMoney(recibo.valor)} destaque />
            <Linha label="Forma de pagamento" value={recibo.formaPagamento} />
            <Linha label="Data do pagamento" value={recibo.dataPagamento.toLocaleDateString("pt-BR", { timeZone: "UTC" })} />
          </dl>

          {urlValidacao && (
            <div className="mt-6 flex items-end justify-between gap-6 rounded-[var(--radius-card)] border border-border p-4">
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-semibold"><ShieldCheck className="size-4" /> Recibo verificável</p>
                <p className="mt-1 text-xs text-[var(--color-ink-500)]">Confira a autenticidade pelo QR code ou pelo código abaixo.</p>
                <p className="mt-2 break-all font-mono text-xs font-bold">{recibo.codigoVerificacao}</p>
              </div>
              <QRCodeSVG value={urlValidacao} size={82} level="M" aria-label="QR code de validação do recibo" />
            </div>
          )}
        </div>

        <footer className="border-t border-border px-6 py-3 text-center text-xs text-[var(--color-ink-500)]">
          {[config.endereco, config.cidade, config.telefone].filter(Boolean).join(" · ")}
        </footer>
      </article>
    </div>
  )
}

function Linha({ label, value, destaque = false }: { label: string; value: string; destaque?: boolean }) {
  return (
    <div className="flex flex-col justify-between gap-1 py-2.5 sm:flex-row sm:items-center">
      <dt className="text-[var(--color-ink-500)]">{label}</dt>
      <dd className={destaque ? "text-base font-extrabold tabular-nums" : "font-semibold"}>{value}</dd>
    </div>
  )
}
