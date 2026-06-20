import Image from "next/image"
import Link from "next/link"
import { Inter, Playfair_Display } from "next/font/google"
import { db } from "@/lib/db"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-body" })
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-heading" })

export const metadata = { title: "Notícias — E.C. Itaquerense" }

const CORES: Record<string, string> = {
  "Resultado":  "linear-gradient(140deg,#0D3B12 0%,#1B5E20 50%,#2E7D32 100%)",
  "Conquista":  "linear-gradient(140deg,#3D2B00 0%,#856000 50%,#B8860B 100%)",
  "Convocação": "linear-gradient(140deg,#0D0D2B 0%,#1A1A2E 50%,#2D2D4E 100%)",
  "Evento":     "linear-gradient(140deg,#4A0B0B 0%,#C62828 60%,#D84040 100%)",
  "Comunicado": "linear-gradient(140deg,#1A1A2E 0%,#2D2D4E 100%)",
  "Notícia":    "linear-gradient(140deg,#4A0B0B 0%,#C62828 60%,#D84040 100%)",
}

const css = `
  .np{
    --red:#C62828;--red-dark:#9F1D1D;--red-deep:#4A0B0B;
    --bg:#FAF8F5;--bg-card:#fff;--bg-muted:#F3EFE9;
    --text:#1A1A2E;--text-muted:#6B6B7B;--text-light:#9696A0;
    --border:#E8E2DA;
    --shadow-sm:0 2px 8px rgba(26,26,46,.07);
    --shadow-md:0 8px 28px rgba(26,26,46,.12);
    --radius-md:12px;--radius-lg:18px;
    font-family:var(--font-body),Arial,sans-serif;
    color:var(--text);background:var(--bg);
    -webkit-font-smoothing:antialiased;min-height:100vh;overflow-x:clip
  }
  .np *{margin:0;padding:0;box-sizing:border-box}
  .np a{text-decoration:none;color:inherit}
  .np .container{max-width:1060px;margin:0 auto;padding:0 24px}

  .np-hdr{
    background:linear-gradient(135deg,#4A0B0B 0%,#C62828 60%,#9F1D1D 100%);
    color:#fff;position:sticky;top:0;z-index:100;
    box-shadow:0 2px 16px rgba(0,0,0,.28)
  }
  .np-hdr .inner{
    max-width:1060px;margin:0 auto;padding:0 24px;
    display:flex;align-items:center;height:68px;gap:14px
  }
  .np-hdr .brand{display:flex;align-items:center;gap:12px;flex:1;min-width:0}
  .np-hdr .brand-name{font-family:var(--font-heading),Georgia,serif;font-size:17px;font-weight:800;letter-spacing:-.3px;white-space:nowrap}
  .np-hdr .brand-sub{font-size:10px;opacity:.7;text-transform:uppercase;letter-spacing:1.5px;font-weight:500}
  .np-hdr .back{font-size:12px;font-weight:600;opacity:.85;color:#fff;border:1px solid rgba(255,255,255,.3);border-radius:6px;padding:6px 14px;white-space:nowrap;flex-shrink:0;transition:background .2s}
  .np-hdr .back:hover{background:rgba(255,255,255,.15);opacity:1}

  .np .hero{background:linear-gradient(135deg,var(--red-deep) 0%,var(--red) 55%,var(--red-dark) 100%);
    color:#fff;padding:72px 0 80px;position:relative;overflow:hidden}
  .np .hero::before{content:'';position:absolute;inset:0;
    background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='rgba(255,255,255,.06)' stroke-width='1'%3E%3Ccircle cx='30' cy='30' r='20'/%3E%3Cline x1='0' y1='30' x2='60' y2='30'/%3E%3Cline x1='30' y1='0' x2='30' y2='60'/%3E%3C/g%3E%3C/svg%3E");
    background-size:60px 60px}
  .np .hero-inner{position:relative;z-index:1}
  .np .hero-badge{display:inline-flex;align-items:center;gap:7px;
    background:rgba(255,255,255,.15);color:#fff;font-size:11px;font-weight:700;
    letter-spacing:1.5px;text-transform:uppercase;padding:6px 14px;border-radius:100px;
    border:1px solid rgba(255,255,255,.3);margin-bottom:20px}
  .np .hero h1{font-family:var(--font-heading),Georgia,serif;font-size:52px;font-weight:800;
    line-height:1.05;letter-spacing:-1px;margin-bottom:12px}
  .np .hero p{font-size:17px;opacity:.88;max-width:480px;line-height:1.65}
  @media(max-width:600px){
    .np .hero{padding:52px 0 60px}
    .np .hero h1{font-size:34px;letter-spacing:-.5px}
  }

  .np .section{padding:56px 0 80px}

  .np .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
  @media(max-width:900px){.np .grid{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:560px){.np .grid{grid-template-columns:1fr}}

  .np .card{border-radius:var(--radius-lg);overflow:hidden;background:var(--bg-card);
    border:1px solid var(--border);box-shadow:var(--shadow-sm);
    transition:transform .25s,box-shadow .25s;display:flex;flex-direction:column}
  .np .card:hover{transform:translateY(-4px);box-shadow:var(--shadow-md)}

  .np .card-img{position:relative;height:180px;flex-shrink:0}
  .np .card-img img{width:100%;height:100%;object-fit:cover}
  .np .card-img-grad{position:absolute;inset:0}
  .np .card-pattern{position:absolute;inset:0;
    background:url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='rgba(255,255,255,.06)' stroke-width='1'%3E%3Ccircle cx='20' cy='20' r='12'/%3E%3C/g%3E%3C/svg%3E");
    background-size:40px 40px}
  .np .card-logo{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
  .np .card-logo img{width:52px;height:52px;object-fit:contain;opacity:.18}
  .np .card-badge{position:absolute;top:14px;left:14px;
    background:rgba(255,255,255,.15);color:#fff;font-size:10px;font-weight:700;
    letter-spacing:1px;text-transform:uppercase;padding:4px 10px;
    border-radius:100px;border:1px solid rgba(255,255,255,.2);backdrop-filter:blur(4px)}

  .np .card-body{padding:20px 22px 22px;flex:1;display:flex;flex-direction:column;gap:10px}
  .np .card-titulo{font-family:var(--font-heading),Georgia,serif;font-size:17px;font-weight:800;
    color:var(--text);line-height:1.25;letter-spacing:-.2px;
    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .np .card-sub{font-size:13px;color:var(--text-muted);line-height:1.55;
    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;flex:1}
  .np .card-date{font-size:11px;font-weight:600;color:var(--text-light);letter-spacing:.3px}

  .np .empty{text-align:center;padding:80px 24px}
  .np .empty-icon{width:80px;height:80px;border-radius:20px;
    background:rgba(198,40,40,.08);display:flex;align-items:center;justify-content:center;
    margin:0 auto 24px;font-size:36px}
  .np .empty h2{font-family:var(--font-heading),Georgia,serif;font-size:24px;font-weight:800;
    color:var(--text);margin-bottom:8px}
  .np .empty p{font-size:14px;color:var(--text-muted);max-width:400px;margin:0 auto 28px;line-height:1.65}
  .np .empty-btn{display:inline-flex;align-items:center;gap:8px;background:var(--red);color:#fff;
    font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:.7px;
    padding:13px 28px;border-radius:100px;transition:background .2s,transform .2s}
  .np .empty-btn:hover{background:var(--red-dark);transform:translateY(-1px)}

  .np .foot{border-top:1px solid var(--border);padding:24px 0;margin-top:0}
  .np .foot .inner{display:flex;align-items:center;justify-content:space-between;
    font-size:12px;color:var(--text-light);flex-wrap:wrap;gap:10px}
  .np .foot a{color:var(--text-muted);font-weight:600;transition:color .2s}
  .np .foot a:hover{color:var(--red)}
`

export default async function NoticiasPublicoPage() {
  const noticias = await db.noticia.findMany({
    where: { publicado: true },
    orderBy: [{ destaque: "desc" }, { createdAt: "desc" }],
    select: { id: true, titulo: true, subtitulo: true, categoria: true, imagemUrl: true, createdAt: true },
  })

  return (
    <div className={`${inter.variable} ${playfair.variable} np`}>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* HEADER */}
      <header className="np-hdr">
        <div className="inner">
          <Link href="/" className="brand">
            <Image src="/logo.png" alt="E.C. Itaquerense" width={40} height={40} style={{ borderRadius: 8, flexShrink: 0 }} />
            <div>
              <div className="brand-name">E.C. Itaquerense</div>
              <div className="brand-sub">Notícias</div>
            </div>
          </Link>
          <Link href="/" className="back">← Voltar ao site</Link>
        </div>
      </header>

      {/* HERO */}
      <div className="hero">
        <div className="container hero-inner">
          <div className="hero-badge">📰 Clube</div>
          <h1>Notícias do Clube</h1>
          <p>Fique por dentro de tudo que acontece no E.C. Itaquerense — resultados, convocações, eventos e muito mais.</p>
        </div>
      </div>

      {/* GRID */}
      <section className="section">
        <div className="container">
          {noticias.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📰</div>
              <h2>Nenhuma publicação ainda</h2>
              <p>Em breve o clube vai publicar notícias, resultados e comunicados aqui. Volte em breve!</p>
              <Link href="/resultados" className="empty-btn">Ver resultados dos jogos</Link>
            </div>
          ) : (
            <div className="grid">
              {noticias.map((n) => {
                const grad = CORES[n.categoria] ?? CORES["Notícia"]
                return (
                  <div className="card" key={n.id}>
                    <div className="card-img">
                      {n.imagemUrl ? (
                        <Image src={n.imagemUrl} alt={n.titulo} fill style={{ objectFit: "cover" }} />
                      ) : (
                        <>
                          <div className="card-img-grad" style={{ background: grad }} />
                          <div className="card-pattern" />
                          <div className="card-logo">
                            <Image src="/logo.png" alt="" width={52} height={52} aria-hidden />
                          </div>
                        </>
                      )}
                      <div className="card-badge">{n.categoria}</div>
                    </div>
                    <div className="card-body">
                      <div className="card-titulo">{n.titulo}</div>
                      {n.subtitulo && <div className="card-sub">{n.subtitulo}</div>}
                      <div className="card-date">{format(new Date(n.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="foot">
        <div className="container">
          <div className="inner">
            <span>© 2026 E.C. Itaquerense. Todos os direitos reservados.</span>
            <div style={{ display: "flex", gap: 20 }}>
              <Link href="/resultados">Resultados</Link>
              <Link href="/horarios">Turmas &amp; Horários</Link>
              <Link href="/matricula">Pré-Matrícula</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
