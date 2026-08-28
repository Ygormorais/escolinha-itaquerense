import { redirect } from "next/navigation"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Trophy, Users, Heart, BookOpen } from "lucide-react"
import { PortalHero } from "@/components/responsavel/portal-hero"

export const metadata = { title: "Nossa História — Escolinha Itaquerense" }

export default async function HistoriaPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated) redirect("/responsavel/login")

  const valores = [
    { icon: Shield, titulo: "Disciplina", desc: "Formamos atletas dentro e fora de campo, com respeito e dedicação." },
    { icon: Trophy, titulo: "Excelência", desc: "Buscamos o melhor em cada treino, jogo e competição." },
    { icon: Users, titulo: "Comunidade", desc: "Família e escolinha caminham juntas no desenvolvimento dos alunos." },
    { icon: Heart, titulo: "Paixão", desc: "O amor pelo futebol move tudo o que fazemos." },
  ]

  return (
    <div className="flex flex-col gap-8">
      <PortalHero
        backHref="/responsavel"
        icon={BookOpen}
        title="Nossa História"
        description="Conheça a origem, os valores e a missão da Escolinha Itaquerense."
      />

      <Card className="border-border/80 border-l-4 border-l-brand-600 shadow-sm">
        <CardContent className="max-w-none space-y-4 p-6 font-body text-sm leading-7 text-[var(--color-ink-700)] sm:p-8">
          <p>
            A <strong className="font-heading text-[var(--color-ink-950)]">Escolinha Itaquerense</strong> nasceu da paixão pelo futebol e do desejo
            de transformar vidas através do esporte. Fundada no coração do bairro Itaquerense,
            nossa escolinha é mais do que um lugar para aprender a jogar futebol — é uma
            família que acolhe, ensina e prepara crianças e jovens para os desafios da vida.
          </p>
          <p>
            Desde o primeiro dia, nosso compromisso é oferecer um ambiente seguro, acolhedor
            e profissional, onde cada aluno é tratado com respeito e atenção individualizada.
            Acreditamos que o esporte é uma ferramenta poderosa de transformação social e
            desenvolvimento pessoal.
          </p>
          <p>
            Ao longo dos anos, já passaram por aqui centenas de alunos que levaram não apenas
            habilidades técnicas com a bola, mas também valores como trabalho em equipe,
            resiliência, respeito ao próximo e dedicação.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {valores.map((v) => (
          <Card key={v.titulo} className="border-border/80 shadow-sm transition-shadow hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                  <v.icon className="size-6" />
                </div>
                <div>
                  <h3 className="mb-1 font-heading text-base font-extrabold tracking-tight">{v.titulo}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/80 bg-[var(--color-paper-50)] shadow-sm dark:bg-muted/30">
        <CardContent className="p-6 text-center sm:p-8">
          <h2 className="mb-2 font-heading text-lg font-extrabold">Vocês já fazem parte dessa história!</h2>
          <p className="text-sm text-muted-foreground">
            Cada treino, conquista e momento vivido pelos nossos atletas também constrói a história da escolinha.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
