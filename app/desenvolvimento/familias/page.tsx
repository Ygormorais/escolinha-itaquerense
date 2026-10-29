import { PAGINA_ADMIN } from "@/components/layout/pagina"
import { redirectIfNotAuthenticated } from "@/lib/auth"
import { PageHeader } from "@/components/layout/page-header"
import { ObjetivosFamilia } from "@/components/desenvolvimento/objetivos-familia"
import { ConversasFamilia } from "@/components/desenvolvimento/conversas-familia"

export const metadata = { title: "Famílias — Desenvolvimento" }
export default async function FamiliasDesenvolvimentoPage() { await redirectIfNotAuthenticated(["admin", "tecnico"])(); return <div className={PAGINA_ADMIN}><PageHeader title="Famílias" description="Objetivos compartilhados e comunicação contextual com histórico." /><ObjetivosFamilia /><ConversasFamilia /></div> }
