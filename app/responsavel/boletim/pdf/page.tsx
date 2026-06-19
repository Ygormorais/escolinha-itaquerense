import { notFound, redirect } from "next/navigation"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { buscarDadosFicha } from "@/lib/ficha-avaliacao"
import { FichaAvaliacaoDoc } from "@/components/boletim/ficha-avaliacao-doc"
import { PrintButton } from "@/components/ui/print-button"

export const metadata = { title: "Ficha de Avaliação — Escolinha Itaquerense" }

export default async function FichaAvaliacaoPdfPage({
  searchParams,
}: {
  searchParams: Promise<{ alunoId?: string; periodo?: string }>
}) {
  const session = await getResponsavelSession()
  if (!session.authenticated) redirect("/responsavel/login")

  const { alunoId: alunoIdRaw, periodo } = await searchParams
  const alunoId = Number(alunoIdRaw)

  if (!Number.isInteger(alunoId) || alunoId <= 0) notFound()
  if (!periodo || periodo.trim() === "") notFound()

  const dados = await buscarDadosFicha(alunoId, periodo.trim(), session.responsavelId!)
  if (!dados) notFound()

  return (
    <div className="p-6">
      <div className="mb-4 print:hidden">
        <PrintButton />
      </div>
      <FichaAvaliacaoDoc dados={dados} />
    </div>
  )
}
