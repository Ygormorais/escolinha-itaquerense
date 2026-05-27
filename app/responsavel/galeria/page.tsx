import { redirect } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { cn } from "@/lib/utils"
import { GaleriaMural } from "@/components/responsavel/galeria-mural"

export default async function GaleriaPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated) redirect("/responsavel/login")

  const midias = await db.media.findMany({
    include: { partida: { include: { campeonato: true } }, campeonato: true },
    orderBy: { createdAt: "desc" },
  })

  const campeonatoMap = new Map<number, {
    campeonato: { id: number; nome: string }
    midiasCampeonato: typeof midias
    partidasComMidia: Map<number, { partida: NonNullable<(typeof midias)[0]["partida"]>; midias: typeof midias }>
  }>()

  for (const m of midias) {
    if (m.campeonatoId && m.campeonato) {
      if (!campeonatoMap.has(m.campeonatoId)) {
        campeonatoMap.set(m.campeonatoId, {
          campeonato: m.campeonato,
          midiasCampeonato: [],
          partidasComMidia: new Map(),
        })
      }
      campeonatoMap.get(m.campeonatoId)!.midiasCampeonato.push(m)
    } else if (m.partidaId && m.partida) {
      const campId = m.partida.campeonatoId
      if (!campeonatoMap.has(campId)) {
        campeonatoMap.set(campId, {
          campeonato: m.partida.campeonato!,
          midiasCampeonato: [],
          partidasComMidia: new Map(),
        })
      }
      const grupo = campeonatoMap.get(campId)!
      if (!grupo.partidasComMidia.has(m.partidaId)) {
        grupo.partidasComMidia.set(m.partidaId, { partida: m.partida, midias: [] })
      }
      grupo.partidasComMidia.get(m.partidaId)!.midias.push(m)
    }
  }

  const grupos = Array.from(campeonatoMap.values())

  const navLinks = [
    { href: "/responsavel", label: "Dashboard" },
    { href: "/responsavel/galeria", label: "Galeria" },
  ]

  return (
    <div className="p-8 space-y-8">
      <nav className="flex items-center gap-2 -m-8 mb-8 px-8 py-4 border-b bg-muted/40">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "px-3 py-2 rounded-md text-sm font-medium transition-colors",
              link.href === "/responsavel/galeria"
                ? "bg-brand-600 text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <h1 className="text-2xl font-bold">Mural</h1>
      <GaleriaMural grupos={grupos} />
    </div>
  )
}
