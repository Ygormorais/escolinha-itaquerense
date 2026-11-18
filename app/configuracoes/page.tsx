import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth"

export const metadata = { title: "Configurações — Escolinha Itaquerense" }

export default async function ConfiguracoesPage() {
  // O proxy só confere o cookie; aqui o perfil vem do banco.
  await requireAuth(["admin", "secretaria"])
  redirect("/dashboard")
}
