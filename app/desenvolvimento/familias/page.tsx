import { redirectIfNotAuthenticated } from "@/lib/auth"
import { PageHeader } from "@/components/layout/page-header"
import { ObjetivosFamilia } from "@/components/desenvolvimento/objetivos-familia"
import { ConversasFamilia } from "@/components/desenvolvimento/conversas-familia"

export const metadata = { title: "Famílias — Desenvolvimento" }
export default async function FamiliasDesenvolvimentoPage() { await redirectIfNotAuthenticated(["admin", "tecnico"])(); return <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8"><PageHeader title="Famílias" description="Objetivos compartilhados e comunicação contextual com histórico." /><ObjetivosFamilia /><ConversasFamilia /></div> }
