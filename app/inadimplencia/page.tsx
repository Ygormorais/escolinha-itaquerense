import { redirect } from "next/navigation"

/** Inadimplência virou o filtro "Atrasados" da central de pagamentos. */
export default function InadimplenciaPage() {
  redirect("/pagamentos?filtro=atrasados")
}
