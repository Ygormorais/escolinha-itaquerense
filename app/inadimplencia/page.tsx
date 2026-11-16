import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth"

/** Inadimplência virou o filtro "Atrasados" da central de pagamentos. */
export default async function InadimplenciaPage() {
  // O proxy só confere o cookie; aqui o perfil vem do banco.
  await requireAuth(["admin", "secretaria"])
  redirect("/pagamentos?filtro=atrasados")
}
