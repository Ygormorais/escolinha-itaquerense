import Link from "next/link"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { getClubConfig } from "@/app/actions/config"
import { PAGINA_ADMIN } from "@/components/layout/pagina"
import { PrintButton } from "@/components/ui/print-button"
import { ReciboDocumento, ESTILO_IMPRESSAO_RECIBO } from "@/components/recibos/recibo-documento"
import { AutoImprimir } from "@/components/recibos/auto-imprimir"

export const metadata = { title: "Recibo — Escolinha Itaquerense" }

/** Um recibo emitido: confere e imprime na mesma tela. */
export default async function ReciboPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ imprimir?: string }>
}) {
  await requireAuth(["admin", "secretaria"])
  const { id: idRaw } = await params
  const { imprimir } = await searchParams
  const id = Number(idRaw)
  if (!Number.isInteger(id) || id <= 0) notFound()

  const [recibo, config] = await Promise.all([db.recibo.findUnique({ where: { id } }), getClubConfig()])
  if (!recibo) notFound()

  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host")
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https")
  const urlValidacao = recibo.codigoVerificacao && host ? `${proto}://${host}/validar-recibo/${recibo.codigoVerificacao}` : null
  const cancelado = recibo.canceladoAt != null

  return (
    <div className={PAGINA_ADMIN}>
      <style>{ESTILO_IMPRESSAO_RECIBO}</style>
      {imprimir === "1" && !cancelado ? <AutoImprimir /> : null}

      <div className="mx-auto flex w-full max-w-[680px] flex-col gap-4">
        <Link href="/recibos" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Voltar aos recibos
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-heading text-xl font-bold">Recibo Nº {recibo.numero}</h1>
          <div className="flex flex-wrap gap-2">
            {recibo.codigoVerificacao ? (
              <a
                href={`/validar-recibo/${recibo.codigoVerificacao}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"
              >
                <ExternalLink className="size-4" /> Validar
              </a>
            ) : null}
            {!cancelado ? <PrintButton label="Imprimir PDF" /> : null}
          </div>
        </div>

        {cancelado ? (
          <p role="alert" className="rounded-md border border-danger-600/25 bg-danger-50 px-4 py-3 text-sm font-semibold text-danger-600">
            Recibo cancelado. Ele fica no histórico, mas não vale como comprovante e não pode ser impresso.
          </p>
        ) : null}

        <ReciboDocumento
          config={config}
          urlValidacao={urlValidacao}
          recibo={{
            numero: recibo.numero,
            alunoNome: recibo.alunoNome,
            responsavel: recibo.responsavel,
            mesReferencia: recibo.mesReferencia,
            valor: recibo.valor,
            formaPagamento: recibo.formaPagamento,
            dataPagamento: recibo.dataPagamento.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }),
            codigoVerificacao: recibo.codigoVerificacao,
          }}
        />
      </div>
    </div>
  )
}
