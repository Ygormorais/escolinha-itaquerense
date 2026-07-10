import Link from "next/link"
import { CalendarClock } from "lucide-react"
import { getTurmasHorarios } from "@/lib/landing/turmas"
import { getConfig } from "@/lib/config"
import { publicFontClass } from "@/lib/public-fonts"
import { pubBase, PUB_HDR_CSS, PUB_FOOT_CSS } from "@/lib/public-css"
import { PublicHeader } from "@/components/public/public-header"
import HorariosClient from "./horarios-client"

export const metadata = {
  title: "Turmas & Horários — E.C. Itaquerense",
  description:
    "Turmas e horários da escolinha e do futsal federado do E.C. Itaquerense. Veja a categoria do seu filho e faça a pré-matrícula.",
}

const css = `
  ${pubBase("hp")}
  .hp ul{list-style:none}
  .hp .container{max-width:1060px;margin:0 auto;padding:0 24px}
  ${PUB_HDR_CSS}
  ${PUB_FOOT_CSS}

  /* HERO */
  .hp .hero{background:linear-gradient(135deg,var(--red-deep) 0%,var(--red) 55%,var(--red-dark) 100%);
    color:#fff;position:relative;overflow:hidden;padding:80px 0 88px}
  .hp .hero::before{content:'';position:absolute;inset:0;
    background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='rgba(255,255,255,.06)' stroke-width='1'%3E%3Ccircle cx='30' cy='30' r='20'/%3E%3Cline x1='0' y1='30' x2='60' y2='30'/%3E%3Cline x1='30' y1='0' x2='30' y2='60'/%3E%3C/g%3E%3C/svg%3E");
    background-size:60px 60px}
  .hp .hero-inner{position:relative;z-index:1}
  .hp .hero-badge{display:inline-flex;align-items:center;gap:7px;
    background:rgba(255,255,255,.15);color:#fff;font-size:11px;font-weight:700;
    letter-spacing:1.5px;text-transform:uppercase;padding:6px 14px;border-radius:100px;
    border:1px solid rgba(255,255,255,.3);margin-bottom:22px}
  .hp .hero-badge svg{flex-shrink:0;opacity:.95}
  .hp .hero h1{font-family:var(--font-heading),Georgia,serif;font-size:54px;font-weight:900;
    line-height:1.05;letter-spacing:-1px;margin-bottom:16px;max-width:700px}
  .hp .hero h1 em{font-style:normal;opacity:.75}
  .hp .hero p{font-size:17px;opacity:.88;max-width:500px;line-height:1.65;font-weight:400}
  .hp .hero-deco{position:absolute;right:-60px;top:-60px;width:440px;height:440px;border-radius:50%;
    background:radial-gradient(circle,rgba(255,255,255,.08) 0%,transparent 70%)}
  .hp .hero-deco2{position:absolute;left:-80px;bottom:-80px;width:300px;height:300px;border-radius:50%;
    background:radial-gradient(circle,rgba(255,255,255,.05) 0%,transparent 70%)}
  @media(max-width:640px){
    .hp .hero{padding:56px 0 64px}
    .hp .hero h1{font-size:36px;letter-spacing:-.5px}
    .hp .hero p{font-size:15px}
  }

  /* SECTION */
  .hp .section{padding:48px 0 80px}
`

export default async function HorariosPage() {
  const [turmas, config] = await Promise.all([getTurmasHorarios(), getConfig()])
  const waNumber = config.whatsapp?.replace(/\D/g, "") || "5511958686579"
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent("Olá! Gostaria de saber sobre as turmas e horários da Escolinha Itaquerense.")}`

  return (
    <div className={`${publicFontClass} hp`}>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <PublicHeader subtitle="Turmas & Horários" />

      <div className="hero">
        <div className="hero-deco" />
        <div className="hero-deco2" />
        <div className="container hero-inner">
          <div className="hero-badge">
            <CalendarClock size={14} strokeWidth={2.25} aria-hidden />
            Temporada 2026
          </div>
          <h1>Turmas <em>&amp;</em><br />Horários</h1>
          <p>
            Escolha a modalidade e a faixa etária do seu filho — escolinha de formação ou
            equipes federadas — e dê o primeiro passo no E.C. Itaquerense.
          </p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <HorariosClient turmas={turmas} waUrl={waUrl} />
        </div>
      </section>

      <footer className="pub-foot">
        <div className="inner">
          <span>© 2026 E.C. Itaquerense. Todos os direitos reservados.</span>
          <div style={{ display: "flex", gap: 20 }}>
            <Link href="/matricula">Pré-Matrícula</Link>
            <Link href="/resultados">Resultados</Link>
            <Link href="/responsavel">Portal do Responsável</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
