import { redirect } from "next/navigation"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Trophy, Users, Heart } from "lucide-react"

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
    <>
      <h1 className="text-2xl font-bold mb-6">Nossa História</h1>

      <Card className="mb-8">
        <CardContent className="prose prose-sm max-w-none p-6 space-y-4">
          <p>
            A <strong>Escolinha Itaquerense</strong> nasceu da paixão pelo futebol e do desejo
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

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        {valores.map((v) => (
          <Card key={v.titulo}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                  <v.icon className="size-6" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{v.titulo}</h3>
                  <p className="text-sm text-muted-foreground">{v.desc}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6 text-center">
          <h2 className="text-lg font-semibold mb-2">Venha fazer parte dessa história!</h2>
          <p className="text-sm text-muted-foreground">
            Entre em contato pelo WhatsApp e agende uma aula experimental.
          </p>
        </CardContent>
      </Card>
    </>
  )
}
