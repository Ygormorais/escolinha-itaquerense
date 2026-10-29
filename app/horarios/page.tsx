import { getTurmasHorarios } from "@/lib/landing/turmas"
import { getConfig } from "@/lib/config"
import { PaginaPublica } from "@/components/site/pagina-publica"
import HorariosClient from "./horarios-client"

export const metadata = {
  title: "Turmas e horários — E.C. Itaquerense",
  description:
    "Turmas e horários da escolinha e do futsal federado do E.C. Itaquerense. Veja a categoria do seu filho e faça a pré-matrícula.",
}

export default async function HorariosPage() {
  const [turmas, config] = await Promise.all([getTurmasHorarios(), getConfig()])
  const waNumber = config.whatsapp?.replace(/\D/g, "") || "5511958686579"
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent("Olá! Gostaria de saber sobre as turmas e horários da Escolinha Itaquerense.")}`

  return (
    <PaginaPublica
      titulo="Turmas e horários"
      descricao="Escolha a modalidade e a categoria do seu filho: escolinha de formação ou equipes federadas da temporada 2026."
    >
      <HorariosClient turmas={turmas} waUrl={waUrl} />
    </PaginaPublica>
  )
}
