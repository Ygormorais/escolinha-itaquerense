import { requireAuth } from "@/lib/auth"
import { listarReunioes } from "@/app/actions/reunioes"
import { ReunioesClient } from "./reunioes-client"

export const metadata = { title: "Reuniões — Escolinha Itaquerense" }

export default async function ReunioesPage() {
  await requireAuth()
  const reunioes = await listarReunioes()
  return <ReunioesClient reunioes={reunioes} />
}
