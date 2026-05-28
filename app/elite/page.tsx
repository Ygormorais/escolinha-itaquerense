import { db } from "@/lib/db"
import { getConfig } from "@/lib/config"
import { TURMAS } from "@/lib/constants"

export const metadata = {
  title: "Elite Itaquerense — Escolinha de Futebol",
  description: "Formando atletas e cidadãos. Matriculas abertas!",
}

export default async function ElitePage() {
  const config = getConfig()
  const [totalAtivos, totalTurmas] = await Promise.all([
    db.aluno.count({ where: { status: "Ativo" } }),
    Promise.all(
      TURMAS.map(async (turma) => {
        const count = await db.aluno.count({ where: { turma, status: "Ativo" } })
        return { turma, count }
      })
    ),
  ])

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-900 via-brand-800 to-brand-900 text-white">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/logo.jpg')] bg-cover bg-center opacity-10" />
        <div className="relative mx-auto max-w-5xl px-6 py-20 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm backdrop-blur-sm">
            <span className="size-2 rounded-full bg-success-500 animate-pulse" />
            Matriculas Abertas
          </div>
          <h1 className="font-heading text-5xl font-extrabold tracking-tight md:text-7xl">
            {config.nome}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70">
            Formando atletas e cidadãos desde 2010. {config.endereco} — {config.cidade}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href={`https://wa.me/55${config.whatsapp?.replace(/\D/g, "")}?text=${encodeURIComponent("Olá! Gostaria de saber mais sobre a escolinha!")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-success-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-success-700 hover:shadow-xl"
            >
              <svg className="size-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              Falar no WhatsApp
            </a>
            <a
              href="#turmas"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Conhecer as Turmas
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm">
            <p className="text-4xl font-extrabold font-heading text-success-400">{totalAtivos}</p>
            <p className="mt-2 text-sm text-white/60">Alunos Ativos</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm">
            <p className="text-4xl font-extrabold font-heading text-white">{TURMAS.length}</p>
            <p className="mt-2 text-sm text-white/60">Turmas</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm">
            <p className="text-4xl font-extrabold font-heading text-white">15+</p>
            <p className="mt-2 text-sm text-white/60">Anos de História</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm">
            <p className="text-4xl font-extrabold font-heading text-white">50+</p>
            <p className="mt-2 text-sm text-white/60">Atletas Formados</p>
          </div>
        </div>
      </section>

      <section id="turmas" className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-center font-heading text-3xl font-bold">Nossas Turmas</h2>
        <p className="mt-3 text-center text-white/60">Do infantil ao sub-17, sempre com foco na formação completa</p>
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3">
          {totalTurmas.map(({ turma, count }) => (
            <div key={turma} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition hover:bg-white/10">
              <h3 className="font-heading text-xl font-bold">{turma}</h3>
              <p className="mt-1 text-sm text-white/60">{count} {count === 1 ? "aluno" : "alunos"}</p>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-success-500 transition-all"
                  style={{ width: `${Math.min(100, (count / config.capacidadeTurma) * 100)}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-white/40">{count}/{config.capacidadeTurma} vagas</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-center font-heading text-3xl font-bold">Por que a Elite?</h2>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { title: "Treinamento Completo", desc: "Técnico, tático e físico com profissionais qualificados." },
            { title: "Valores e Disciplina", desc: "Formação de cidadãos além de atletas." },
            { title: "Competições Reais", desc: "Participação em campeonatos e torneios regionais." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <h3 className="font-heading text-lg font-bold">{item.title}</h3>
              <p className="mt-2 text-sm text-white/60">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 py-10 text-center text-sm text-white/40">
        <p>{config.nome} · {config.endereco}</p>
        <p className="mt-1">© {new Date().getFullYear()} Todos os direitos reservados</p>
      </footer>
    </div>
  )
}
