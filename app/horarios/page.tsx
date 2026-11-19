import { getTurmasHorarios } from "@/lib/landing/turmas"
import { getConfig } from "@/lib/config"
import { metadataPublica } from "@/lib/site/seo"
import { enderecoEmUmaLinha, rotasDoLocal } from "@/lib/site/mapas"
import { PaginaPublica } from "@/components/site/pagina-publica"
import HorariosClient from "./horarios-client"

export const metadata = metadataPublica({
  title: "Turmas e horários",
  description:
    "Turmas e horários da escolinha e do futsal federado do E.C. Itaquerense. Veja a categoria do seu filho e faça a pré-matrícula.",
  path: "/horarios",
})

export default async function HorariosPage() {
  const [turmas, config] = await Promise.all([getTurmasHorarios(), getConfig()])
  const waNumber = config.whatsapp?.replace(/\D/g, "") || "5511958686579"
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent("Olá! Gostaria de saber sobre as turmas e horários da Escolinha Itaquerense.")}`

  const rotas = rotasDoLocal(config)
  const local = rotas ? { endereco: enderecoEmUmaLinha(config), rotas } : null

  return (
    <PaginaPublica
      titulo="Turmas e horários"
      descricao="Escolha a modalidade e a categoria do seu filho: escolinha de formação ou equipes federadas da temporada 2026."
    >
      <HorariosClient turmas={turmas} waUrl={waUrl} waNumero={waNumber} local={local} />
    </PaginaPublica>
  )
}
