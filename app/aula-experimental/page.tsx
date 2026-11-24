import Link from "next/link"
import { Check } from "lucide-react"
import { PaginaPublica } from "@/components/site/pagina-publica"
import { getConfig } from "@/lib/config"
import { metadataPublica } from "@/lib/site/seo"
import { listarJanelasPublicas } from "@/lib/aula-experimental-dados"
import { AulaExperimentalForm } from "./aula-experimental-form"
import "./aula-experimental.css"

export const dynamic = "force-dynamic"

export const metadata = metadataPublica({
  title: "Aula experimental grátis",
  description:
    "Agende uma aula experimental gratuita na escolinha de futsal do E.C. Itaquerense. Escolha a data, informe os dados e receba a confirmação na hora.",
  path: "/aula-experimental",
})

const GARANTIAS = ["Aula sem custo", "Confirmação na hora", "Sem compromisso de matrícula"]

export default async function AulaExperimentalPage() {
  const [config, janelas] = await Promise.all([getConfig(), listarJanelasPublicas()])
  const waDigits = config.whatsapp?.replace(/\D/g, "") ?? ""
  const whatsappUrl =
    waDigits.length >= 10
      ? `https://wa.me/${waDigits}?text=${encodeURIComponent("Olá! Tenho uma dúvida sobre a aula experimental da escolinha.")}`
      : null

  return (
    <PaginaPublica
      titulo="Aula experimental"
      descricao="Venha conhecer a escolinha antes de se matricular. Escolha uma data, agende em poucos passos e traga o atleta para treinar com a turma."
      largura="leitura"
      className="ae"
      complemento={
        <ul className="ae-trust">
          {GARANTIAS.map((t) => (
            <li key={t} className="ae-trust-item">
              <Check size={16} strokeWidth={2.5} aria-hidden />
              {t}
            </li>
          ))}
        </ul>
      }
    >
      <div className="ae-card">
        <div className="ae-form-hdr">
          <h2 className="ae-form-title">Agende a aula</h2>
          <p className="ae-form-sub">
            Campos com * são obrigatórios. Pedimos só o necessário para reservar a vaga.{" "}
            Já decidiu? <Link href="/matricula">Faça a pré-matrícula</Link>.
          </p>
        </div>
        <AulaExperimentalForm janelas={janelas} whatsappUrl={whatsappUrl} />
      </div>
    </PaginaPublica>
  )
}
