import Image from "next/image"
import Link from "next/link"
import { getTurmasHorarios } from "@/lib/landing/turmas"
import { getConfig } from "@/lib/config"
import { Inter, Playfair_Display } from "next/font/google"

export const metadata = { title: "Turmas & Horários — E.C. Itaquerense" }

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-body" })
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-heading" })

const css = `
  .hp{
    --red:#C62828;--red-dark:#9F1D1D;--red-deep:#4A0B0B;
    --bg:#FAF8F5;--bg-card:#FFFFFF;--bg-muted:#F3EFE9;
    --text:#1A1A2E;--text-muted:#6B6B7B;--text-light:#9696A0;
    --border:#E8E2DA;
    --shadow-sm:0 2px 8px rgba(26,26,46,.08);
    --shadow-md:0 4px 20px rgba(26,26,46,.10);
    --radius-md:12px;--radius-lg:18px;
    --transition:all 0.25s ease;
    font-family:var(--font-body),Arial,sans-serif;
    color:var(--text);background:var(--bg);
    -webkit-font-smoothing:antialiased;min-height:100vh;
  }
  .hp *{margin:0;padding:0;box-sizing:border-box}
  .hp a{text-decoration:none;color:inherit}
  .hp .container{max-width:960px;margin:0 auto;padding:0 24px}
  .hp header{background:rgba(255,255,255,.97);backdrop-filter:blur(8px);
    border-bottom:1px solid var(--border);position:sticky;top:0;z-index:100}
  .hp .hrow{display:flex;align-items:center;height:72px;gap:14px}
  .hp .brand{display:flex;align-items:center;gap:12px;flex-shrink:0}
  .hp .brand img{width:44px;height:44px;object-fit:contain}
  .hp .brand .name b{display:block;font-size:17px;font-weight:700;color:var(--red);letter-spacing:.3px}
  .hp .brand .name span{font-size:10px;color:var(--text-light);letter-spacing:2px;text-transform:uppercase}
  .hp .back{margin-left:auto;font-size:13px;font-weight:600;color:var(--text-muted);
    display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:100px;
    border:1px solid var(--border);transition:var(--transition)}
  .hp .back:hover{background:var(--bg-muted);color:var(--text)}
  .hp .hero-bar{background:linear-gradient(135deg,var(--red-deep) 0%,var(--red) 100%);
    color:#fff;padding:56px 0 48px}
  .hp .hero-bar h1{font-family:var(--font-heading),Georgia,serif;font-size:40px;
    font-weight:800;letter-spacing:-.5px;margin-bottom:10px}
  .hp .hero-bar p{font-size:16px;opacity:.88;max-width:560px;line-height:1.6}
  .hp .content{padding:56px 0 72px}
  .hp .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:48px}
  .hp .card{background:var(--bg-card);border:1px solid var(--border);
    border-radius:var(--radius-lg);padding:28px 24px;box-shadow:var(--shadow-sm);
    transition:var(--transition)}
  .hp .card:hover{box-shadow:var(--shadow-md);transform:translateY(-3px)}
  .hp .card-head{display:flex;align-items:center;gap:10px;margin-bottom:18px;
    padding-bottom:14px;border-bottom:1px solid var(--border)}
  .hp .card-icon{width:40px;height:40px;border-radius:10px;
    background:linear-gradient(135deg,var(--red),var(--red-dark));
    display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;flex-shrink:0}
  .hp .card-head b{font-size:15px;font-weight:700;color:var(--text);text-transform:uppercase;letter-spacing:.4px}
  .hp .horario-list{display:flex;flex-direction:column;gap:9px}
  .hp .horario-item{display:flex;align-items:center;gap:9px;font-size:14px;color:var(--text-muted);line-height:1.4}
  .hp .horario-item i{font-size:14px;color:var(--red);opacity:.8;flex-shrink:0}
  .hp .vazio{text-align:center;padding:48px 0;color:var(--text-muted)}
  .hp .vazio p{font-size:15px;line-height:1.6;margin-top:8px}
  .hp .cta-box{background:var(--bg-muted);border:1px solid var(--border);
    border-radius:var(--radius-lg);padding:40px;text-align:center}
  .hp .cta-box h2{font-family:var(--font-heading),Georgia,serif;font-size:26px;
    font-weight:700;margin-bottom:10px}
  .hp .cta-box p{font-size:15px;color:var(--text-muted);margin-bottom:24px;max-width:480px;
    margin-left:auto;margin-right:auto;line-height:1.65}
  .hp .btn-red{display:inline-block;background:var(--red);color:#fff;font-weight:700;
    font-size:13px;text-transform:uppercase;letter-spacing:.8px;padding:14px 32px;
    border-radius:8px;transition:var(--transition)}
  .hp .btn-red:hover{background:var(--red-dark);transform:translateY(-1px);
    box-shadow:0 6px 20px rgba(198,40,40,.35)}
  @media(max-width:768px){
    .hp .grid{grid-template-columns:repeat(2,1fr)}
    .hp .hero-bar h1{font-size:30px}
  }
  @media(max-width:500px){
    .hp .grid{grid-template-columns:1fr}
    .hp .hero-bar{padding:40px 0 36px}
    .hp .cta-box{padding:28px 20px}
  }
`

export default async function HorariosPage() {
  const [turmas, config] = await Promise.all([getTurmasHorarios(), getConfig()])
  const waNumber = config.whatsapp?.replace(/\D/g, "") || "5511999999999"
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent("Olá! Gostaria de saber sobre turmas e horários disponíveis na Escolinha Itaquerense.")}`

  return (
    <div className={`${inter.variable} ${playfair.variable} hp`}>
      <link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.1.0/dist/tabler-icons.min.css" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <header>
        <div className="container hrow">
          <Link className="brand" href="/">
            <Image src="/logo.png" alt="E.C. Itaquerense" width={44} height={44} />
            <span className="name"><b>E.C. Itaquerense</b><span>Site Oficial</span></span>
          </Link>
          <Link className="back" href="/">
            <i className="ti ti-arrow-left"></i> Voltar
          </Link>
        </div>
      </header>

      <div className="hero-bar">
        <div className="container">
          <h1>Turmas &amp; Horários</h1>
          <p>Encontre a turma certa para o seu filho e inicie a formação esportiva com a gente.</p>
        </div>
      </div>

      <div className="content">
        <div className="container">
          {turmas.length === 0 ? (
            <div className="vazio">
              <i className="ti ti-calendar-off" style={{ fontSize: 48, opacity: .3 }}></i>
              <p>Nenhuma turma com horários cadastrados no momento.<br />Entre em contato pelo WhatsApp para mais informações.</p>
            </div>
          ) : (
            <div className="grid">
              {turmas.map((t) => (
                <div className="card" key={t.turma}>
                  <div className="card-head">
                    <div className="card-icon"><i className="ti ti-ball-football"></i></div>
                    <b>{t.turma}</b>
                  </div>
                  <div className="horario-list">
                    {t.horarios.map((h) => (
                      <div className="horario-item" key={h}>
                        <i className="ti ti-clock"></i>
                        {h}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="cta-box">
            <h2>Garanta a vaga do seu filho</h2>
            <p>Faça a pré-matrícula agora ou tire suas dúvidas pelo WhatsApp — respondemos rapidinho.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link className="btn-red" href="/matricula">Fazer Matrícula</Link>
              <a className="btn-red" href={waUrl} target="_blank" rel="noopener noreferrer"
                style={{ background: "#25D366" }}>
                <i className="ti ti-brand-whatsapp" style={{ marginRight: 6 }}></i>Falar no WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
