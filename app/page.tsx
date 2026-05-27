import Link from "next/link"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { DashboardHome } from "@/components/admin/dashboard-home"
import { getConfig } from "@/lib/config"

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>
}) {
  const session = await getSession()

  if (session.authenticated) {
    return <DashboardHome searchParams={searchParams} />
  }

  const config = getConfig()
  const partidas = await db.partida.findMany({
    include: { campeonato: true },
    orderBy: { data: "asc" },
    take: 4,
  })

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');

            :root {
              --brand: #C62828;
              --brand-dark: #8E0000;
              --brand-light: #FFEBEE;
              --white: #FFFFFF;
              --off-white: #FAFAF8;
              --text: #1A1A1A;
              --muted: #6B6363;
            }

            * { box-sizing: border-box; }
            html { scroll-behavior: smooth; }
            body { margin: 0; }

            .lp {
              font-family: "Inter", sans-serif;
              color: var(--text);
              background: var(--white);
            }

            .lp a { color: inherit; text-decoration: none; }

            .lp-container {
              width: min(1200px, calc(100% - 40px));
              margin: 0 auto;
            }

            .lp-nav {
              position: sticky;
              top: 0;
              z-index: 30;
              background: var(--white);
              border-bottom: 1px solid #EFE6E6;
            }

            .lp-nav-inner {
              display: flex;
              align-items: center;
              justify-content: space-between;
              height: 64px;
              gap: 20px;
            }

            .lp-logo {
              display: flex;
              align-items: center;
              gap: 10px;
              font-family: "Nunito", sans-serif;
              font-size: 20px;
              font-weight: 800;
              color: var(--brand);
            }

            .lp-logo-icon {
              width: 36px;
              height: 36px;
              background: var(--brand);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: var(--white);
              font-size: 18px;
            }

            .lp-nav-links {
              display: flex;
              align-items: center;
              gap: 24px;
            }

            .lp-nav-link {
              font-size: 14px;
              font-weight: 600;
              color: var(--muted);
              transition: color 160ms ease;
            }
            .lp-nav-link:hover { color: var(--brand); }

            .lp-btn {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              height: 44px;
              padding: 0 24px;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 700;
              transition: all 160ms ease;
              cursor: pointer;
              border: none;
            }

            .lp-btn-primary {
              background: var(--brand);
              color: var(--white);
            }
            .lp-btn-primary:hover { background: var(--brand-dark); }

            .lp-btn-outline {
              background: transparent;
              color: var(--brand);
              border: 2px solid var(--brand);
            }
            .lp-btn-outline:hover { background: var(--brand-light); }

            .lp-hero {
              background: linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%);
              color: var(--white);
              position: relative;
              overflow: hidden;
            }

            .lp-hero::before {
              content: "";
              position: absolute;
              inset: 0;
              background-image:
                linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px);
              background-size: 40px 40px;
              pointer-events: none;
            }

            .lp-hero-inner {
              position: relative;
              display: grid;
              gap: 24px;
              padding: 80px 0;
            }

            .lp-hero-tag {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              font-size: 13px;
              font-weight: 700;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              opacity: 0.85;
            }

            .lp-hero-title {
              margin: 0;
              font-family: "Nunito", sans-serif;
              font-size: clamp(44px, 8vw, 80px);
              font-weight: 900;
              line-height: 0.95;
              max-width: 10ch;
            }

            .lp-hero p {
              margin: 0;
              max-width: 600px;
              font-size: 17px;
              line-height: 1.7;
              opacity: 0.9;
            }

            .lp-hero-actions {
              display: flex;
              flex-wrap: wrap;
              gap: 12px;
            }

            .lp-hero-actions .lp-btn-outline {
              border-color: var(--white);
              color: var(--white);
            }
            .lp-hero-actions .lp-btn-outline:hover {
              background: rgba(255,255,255,0.15);
            }

            .lp-section {
              padding: 64px 0;
              border-bottom: 1px solid #EFE6E6;
            }
            .lp-section:last-of-type { border-bottom: none; }

            .lp-section-title {
              margin: 0 0 8px;
              font-family: "Nunito", sans-serif;
              font-size: clamp(28px, 4vw, 40px);
              font-weight: 800;
              color: var(--brand);
            }

            .lp-section-sub {
              margin: 0 0 32px;
              color: var(--muted);
              font-size: 16px;
              max-width: 600px;
            }

            .lp-grid-3 {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
            }

            .lp-grid-4 {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 20px;
            }

            .lp-card {
              border: 1px solid #EFE6E6;
              border-radius: 12px;
              padding: 24px;
              background: var(--white);
              transition: box-shadow 200ms ease, transform 200ms ease;
            }
            .lp-card:hover {
              box-shadow: 0 8px 24px rgba(198,40,40,0.10);
              transform: translateY(-2px);
            }

            .lp-card-icon {
              width: 44px;
              height: 44px;
              background: var(--brand-light);
              border-radius: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 22px;
              margin-bottom: 14px;
            }

            .lp-card h3 {
              margin: 0 0 6px;
              font-size: 17px;
              font-weight: 700;
            }

            .lp-card p {
              margin: 0;
              font-size: 14px;
              line-height: 1.6;
              color: var(--muted);
            }

            .lp-clubhouse {
              background: var(--brand-light);
              border-radius: 16px;
              padding: 40px;
              display: grid;
              gap: 16px;
            }

            .lp-clubhouse h2 {
              margin: 0;
              font-family: "Nunito", sans-serif;
              font-size: 28px;
              font-weight: 800;
              color: var(--brand);
            }

            .lp-clubhouse p {
              margin: 0;
              max-width: 700px;
              line-height: 1.7;
              color: var(--muted);
            }

            .lp-table {
              width: 100%;
              border-collapse: collapse;
              border-radius: 12px;
              overflow: hidden;
              border: 1px solid #EFE6E6;
            }

            .lp-table th {
              background: var(--brand);
              color: var(--white);
              font-size: 13px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.06em;
              padding: 14px 16px;
              text-align: left;
            }

            .lp-table td {
              padding: 14px 16px;
              font-size: 14px;
              border-bottom: 1px solid #EFE6E6;
            }

            .lp-table tr:last-child td { border-bottom: none; }
            .lp-table tr:nth-child(even) td { background: #FFFBFB; }
            .lp-table td:first-child { font-weight: 600; }

            .lp-table-badge {
              display: inline-block;
              padding: 2px 10px;
              border-radius: 99px;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              background: var(--brand-light);
              color: var(--brand);
            }

            .lp-cta {
              background: var(--brand);
              color: var(--white);
              text-align: center;
              padding: 56px 0;
            }

            .lp-cta h2 {
              margin: 0 0 8px;
              font-family: "Nunito", sans-serif;
              font-size: clamp(24px, 4vw, 36px);
              font-weight: 800;
            }

            .lp-cta p {
              margin: 0 0 24px;
              opacity: 0.85;
              font-size: 16px;
            }

            .lp-cta .lp-btn-primary {
              background: var(--white);
              color: var(--brand);
              border: none;
            }
            .lp-cta .lp-btn-primary:hover { background: #f0f0f0; }

            .lp-footer {
              background: #1A1214;
              color: rgba(255,255,255,0.7);
              padding: 40px 0;
              font-size: 14px;
            }

            .lp-footer-inner {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 24px;
            }

            .lp-footer h3 {
              margin: 0 0 12px;
              color: var(--white);
              font-family: "Nunito", sans-serif;
              font-size: 18px;
              font-weight: 700;
            }

            .lp-footer p { margin: 4px 0; line-height: 1.6; }
            .lp-footer a { color: rgba(255,255,255,0.7); transition: color 160ms ease; }
            .lp-footer a:hover { color: var(--white); }

            .lp-footer-bottom {
              border-top: 1px solid rgba(255,255,255,0.1);
              margin-top: 24px;
              padding-top: 20px;
              text-align: center;
              font-size: 13px;
            }

            @media (max-width: 768px) {
              .lp-grid-3, .lp-grid-4 { grid-template-columns: 1fr; }
              .lp-nav-links { display: none; }
              .lp-footer-inner { grid-template-columns: 1fr; }
              .lp-table { font-size: 12px; }
              .lp-table th, .lp-table td { padding: 10px 8px; }
              .lp-clubhouse { padding: 24px; }
            }
          `,
        }}
      />

      <div className="lp">
        <nav className="lp-nav">
          <div className="lp-container lp-nav-inner">
            <Link href="/" className="lp-logo">
              <div className="lp-logo-icon">⚽</div>
              Elite Itaquerense
            </Link>
            <div className="lp-nav-links">
              <a className="lp-nav-link" href="#sobre">Sobre</a>
              <a className="lp-nav-link" href="#modalidades">Modalidades</a>
              <a className="lp-nav-link" href="#diferenciais">Diferenciais</a>
              <a className="lp-nav-link" href="#jogos">Jogos</a>
              <Link className="lp-btn lp-btn-primary" href="/responsavel/login">Portal</Link>
            </div>
          </div>
        </nav>

        <section className="lp-hero">
          <div className="lp-container lp-hero-inner">
            <div className="lp-hero-tag">⚽ Desde 2025 em Itaquera</div>
            <h1 className="lp-hero-title">O futebol que transforma</h1>
            <p>
              Mais que uma escolinha — uma família. Formamos atletas e cidadãos através do esporte,
              com acompanhamento profissional, valores sólidos e muita paixão pela bola.
            </p>
            <div className="lp-hero-actions">
              <Link className="lp-btn lp-btn-primary" href="/responsavel/login">Portal do Responsável</Link>
              <Link className="lp-btn lp-btn-outline" href="/login">Acesso Administrativo</Link>
            </div>
          </div>
        </section>

        <section id="sobre" className="lp-section">
          <div className="lp-container">
            <div className="lp-clubhouse">
              <h2>Sobre a Escolinha</h2>
              <p>
                A <strong>Elite Itaquerense</strong> nasceu da paixão pelo futebol e do desejo
                de transformar vidas através do esporte. Localizada no coração de Itaquera,
                nossa escolinha oferece treinos de futebol para crianças e jovens em um ambiente
                seguro, acolhedor e profissional.
              </p>
              <p>
                Acreditamos que o esporte é uma ferramenta poderosa de transformação social.
                Por isso, cada treino é pensado para desenvolver não apenas habilidades técnicas,
                mas também valores como trabalho em equipe, respeito, disciplina e dedicação.
              </p>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 8 }}>
                <div><strong style={{ color: "var(--brand)", fontSize: 24 }}>+{50}</strong><br /><span style={{ fontSize: 13, color: "var(--muted)" }}>Alunos ativos</span></div>
                <div><strong style={{ color: "var(--brand)", fontSize: 24 }}>3</strong><br /><span style={{ fontSize: 13, color: "var(--muted)" }}>Turmas</span></div>
                <div><strong style={{ color: "var(--brand)", fontSize: 24 }}>100%</strong><br /><span style={{ fontSize: 13, color: "var(--muted)" }}>Dedicado ao esporte</span></div>
              </div>
            </div>
          </div>
        </section>

        <section id="modalidades" className="lp-section">
          <div className="lp-container">
            <h2 className="lp-section-title">Modalidades</h2>
            <p className="lp-section-sub">
              Turmas organizadas por faixa etária para desenvolvimento progressivo
            </p>
            <div className="lp-grid-3">
              {[
                { icon: "👶", title: "Iniciação", desc: "6 a 9 anos — Fundamentos básicos, coordenação motora e diversão como ponto de partida." },
                { icon: "⚡", title: "Desenvolvimento", desc: "10 a 13 anos — Aprimoramento técnico, tático e físico com foco no crescimento esportivo." },
                { icon: "🏆", title: "Competitivo", desc: "14 a 17 anos — Preparação para competições, jogos e campeonatos." },
              ].map((m) => (
                <div key={m.title} className="lp-card">
                  <div className="lp-card-icon">{m.icon}</div>
                  <h3>{m.title}</h3>
                  <p>{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="diferenciais" className="lp-section">
          <div className="lp-container">
            <h2 className="lp-section-title">Nossos Diferenciais</h2>
            <p className="lp-section-sub">Por que escolher a Elite Itaquerense</p>
            <div className="lp-grid-4">
              {[
                { icon: "👨‍🏫", title: "Profissionais", desc: "Corpo técnico qualificado e experiente" },
                { icon: "📊", title: "Acompanhamento", desc: "Relatórios de desempenho individuais" },
                { icon: "📱", title: "Portal Exclusivo", desc: "Acompanhe tudo pelo celular" },
                { icon: "🤝", title: "Família Presente", desc: "Comunicação direta com os pais" },
                { icon: "🏟️", title: "Estrutura", desc: "Espaço adequado para treinos" },
                { icon: "🎯", title: "Metodologia", desc: "Treinos periodizados por faixa" },
                { icon: "🏅", title: "Competições", desc: "Participação em campeonatos" },
                { icon: "💬", title: "WhatsApp", desc: "Canal direto com a escolinha" },
              ].map((d) => (
                <div key={d.title} className="lp-card">
                  <div className="lp-card-icon">{d.icon}</div>
                  <h3>{d.title}</h3>
                  <p>{d.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="jogos" className="lp-section">
          <div className="lp-container">
            <h2 className="lp-section-title">Próximos Jogos</h2>
            <p className="lp-section-sub">Acompanhe a agenda dos nossos atletas</p>
            {partidas.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table className="lp-table">
                  <thead>
                    <tr>
                      <th>Campeonato</th>
                      <th>Adversário</th>
                      <th>Data</th>
                      <th>Local</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partidas.map((p) => (
                      <tr key={p.id}>
                        <td><span className="lp-table-badge">{p.campeonato.nome}</span></td>
                        <td>{p.adversario}</td>
                        <td>{new Date(p.data).toLocaleDateString("pt-BR")}</td>
                        <td>{p.local}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: "var(--muted)" }}>Em breve novos jogos serão cadastrados.</p>
            )}
          </div>
        </section>

        <section className="lp-cta">
          <div className="lp-container">
            <h2>Venha fazer parte desse time</h2>
            <p>Entre em contato e agende uma aula experimental gratuita</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <a
                href={`https://wa.me/${config.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="lp-btn lp-btn-primary"
              >
                Fale no WhatsApp
              </a>
              <Link className="lp-btn lp-btn-outline" style={{ borderColor: "var(--white)", color: "var(--white)" }} href="/responsavel/login">
                Portal do Responsável
              </Link>
            </div>
          </div>
        </section>

        <footer className="lp-footer">
          <div className="lp-container">
            <div className="lp-footer-inner">
              <div>
                <h3>Elite Itaquerense</h3>
                <p>Formando atletas e cidadãos através do esporte.</p>
                <p>{config.endereco}</p>
                <p>{config.cidade}</p>
              </div>
              <div>
                <h3>Contato</h3>
                <p>
                  <a href={`https://wa.me/${config.whatsapp}`} target="_blank" rel="noopener noreferrer">
                    WhatsApp: {config.telefone || config.whatsapp}
                  </a>
                </p>
                <p>📧 {config.chavePix.includes("@") ? config.chavePix : "contato@eliteitaquerense.com"}</p>
                <br />
                <Link href="/login" style={{ fontSize: 13, opacity: 0.6 }}>Administrativo</Link>
              </div>
            </div>
            <div className="lp-footer-bottom">
              © {new Date().getFullYear()} Elite Itaquerense. Todos os direitos reservados.
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
