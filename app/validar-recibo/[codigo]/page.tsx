import { notFound } from "next/navigation"
import { CheckCircle2, XCircle, ShieldCheck } from "lucide-react"
import { db } from "@/lib/db"
import { calcularHashRecibo } from "@/lib/recibos"
import { getConfig } from "@/lib/config"
import { formatMoney } from "@/lib/utils"

export const metadata = { title: "Validar recibo — Escolinha Itaquerense" }

export default async function ValidarReciboPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params
  const recibo = await db.recibo.findUnique({ where: { codigoVerificacao: codigo } })
  if (!recibo) notFound()

  const config = getConfig()
  const legado = !recibo.hashIntegridade
  const hashAtual = recibo.codigoVerificacao ? calcularHashRecibo({ ...recibo, codigoVerificacao: recibo.codigoVerificacao }) : null
  const integro = legado || hashAtual === recibo.hashIntegridade
  const valido = !recibo.canceladoAt && integro

  return (
    <main className="min-h-screen bg-[var(--color-paper-50)] px-4 py-12 text-foreground">
      <article className="mx-auto max-w-2xl overflow-hidden rounded-3xl border bg-white shadow-xl">
        <header className={`px-7 py-7 text-white ${valido ? "bg-brand-800" : "bg-danger-700"}`}>
          <div className="flex items-start justify-between gap-5">
            <div><p className="text-sm text-white/75">{config.nome}</p><h1 className="mt-1 font-heading text-3xl font-bold">Validação de recibo</h1></div>
            <ShieldCheck className="size-10" />
          </div>
        </header>
        <div className="p-7 sm:p-9">
          <div className={`flex items-center gap-3 rounded-2xl p-4 ${valido ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
            {valido ? <CheckCircle2 className="size-6" /> : <XCircle className="size-6" />}
            <div><p className="font-bold">{valido ? legado ? "Registro legado localizado e ativo" : "Recibo autêntico e ativo" : recibo.canceladoAt ? "Recibo cancelado" : "Integridade não confirmada"}</p><p className="text-sm opacity-80">Registro localizado no sistema da escolinha.</p></div>
          </div>
          <dl className="mt-7 divide-y">
            <Linha label="Número" value={recibo.numero} />
            <Linha label="Referência" value={recibo.mesReferencia} />
            <Linha label="Valor recebido" value={formatMoney(recibo.valor)} />
            <Linha label="Forma de pagamento" value={recibo.formaPagamento} />
            <Linha label="Data do pagamento" value={recibo.dataPagamento.toLocaleDateString("pt-BR")} />
            <Linha label="Emitido em" value={recibo.createdAt.toLocaleString("pt-BR")} />
            <Linha label="Código de verificação" value={recibo.codigoVerificacao ?? "Registro legado"} mono />
          </dl>
          <p className="mt-7 text-xs leading-relaxed text-muted-foreground">Esta página confirma a existência, integridade e situação do registro no sistema. Ela não representa assinatura digital ICP-Brasil.</p>
        </div>
      </article>
    </main>
  )
}

function Linha({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center"><dt className="text-sm text-muted-foreground">{label}</dt><dd className={`font-semibold ${mono ? "break-all font-mono text-sm" : ""}`}>{value}</dd></div>
}
