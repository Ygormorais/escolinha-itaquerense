import { redirect } from "next/navigation"

export const metadata = { title: "Configurações — Escolinha Itaquerense" }

export default function ConfiguracoesPage() {
  redirect("/dashboard")
}
