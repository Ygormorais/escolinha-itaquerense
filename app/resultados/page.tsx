import { db } from "@/lib/db"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Image from "next/image"
import Link from "next/link"

export const metadata = {
  title: "Resultados — E.C. Itaquerense",
  description: "Resultados, classificação e próximos jogos da Escolinha de Futsal E.C. Itaquerense.",
}

const css = `
  .resultados { font-family: 'Roboto', sans-serif; background: #f9fafb; min-height: 100vh; color: #1a1a1a; }
  .resultados .container { max-width: 900px; margin: 0 auto; padding: 24px 16px; }
  .resultados header { background: #7F0000; color: #fff; padding: 24px 0; margin-bottom: 32px; }
  .resultados header .container { display: flex; align-items: center; gap: 16px; }
  .resultados header h1 { font-size: 22px; font-weight: 700; margin: 0; }
  .resultados header p { font-size: 13px; opacity: .8; margin: 0; }
  .resultados .camp-block { background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; padding: 24px; margin-bottom: 24px; }
  .resultados .camp-title { font-size: 18px; font-weight: 700; color: #7F0000; margin-bottom: 4px; }
  .resultados .camp-status { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; background: #fef9c3; color: #854d0e; padding: 2px 8px; border-radius: 999px; }
  .resultados table { width: 100%; border-collapse: collapse; font-size: 14px; }
  .resultados th { text-align: left; padding: 8px 12px; background: #f3f4f6; font-size: 11px; text-transform: uppercase; color: #6b7280; }
  .resultados td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; }
  .resultados .nosso td { background: #fff5f5; font-weight: 600; color: #7F0000; }
  .resultados .placar { font-weight: 700; font-size: 16px; color: #1a1a1a; }
  .resultados .sumula-link { color: #7F0000; font-size: 12px; font-weight: 600; text-decoration: none; }
  .resultados .share-btn { display: inline-flex; align-items: center; gap: 6px; background: #25D366; color: #fff; border: none; border-radius: 6px; padding: 8px 14px; font-size: 13px; font-weight: 700; cursor: pointer; text-decoration: none; margin-top: 12px; }
  .resultados footer { text-align: center; padding: 32px 16px; font-size: 13px; color: #6b7280; }
  .resultados footer a { color: #7F0000; text-decoration: none; margin: 0 8px; }
  .resultados .empty { text-align: center; padding: 48px; color: #6b7280; }
`

export default async function ResultadosPage() {
  const campeonatos = await db.campeonato.findMany({
    where: { fpfsEventoId: { not: null } },
    include: {
      partidas: { orderBy: { data: "desc" }, take: 20 },
      classificacaoFpfs: { orderBy: [{ fase: "asc" }, { posicao: "asc" }] },
    },
    orderBy: { dataInicio: "desc" },
  })

  const agora = new Date()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  return (
    <div className="resultados">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <header>
        <div className="container">
          <Image src="/logo.png" alt="E.C. Itaquerense" width={48} height={48} style={{ borderRadius: 8 }} />
          <div>
            <h1>E.C. Itaquerense</h1>
            <p>Resultados &amp; Classificação</p>
          </div>
        </div>
      </header>

      <div className="container">
        {campeonatos.length === 0 && (
          <div className="empty">
            <p>Nenhum campeonato em andamento no momento.</p>
          </div>
        )}

        {campeonatos.map((camp) => {
          const realizadas = camp.partidas.filter((p) => p.golsPro != null).slice(0, 5)
          const proximas = camp.partidas.filter((p) => p.golsPro == null && new Date(p.data) >= agora).slice(0, 5)
          const shareMsg = `Veja os resultados da Escolinha Itaquerense — ${camp.nome}: ${appUrl}/resultados`
          const waHref = `https://wa.me/?text=${encodeURIComponent(shareMsg)}`

          return (
            <div key={camp.id} className="camp-block">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span className="camp-title">{camp.nome}</span>
                <span className="camp-status">{camp.status}</span>
                {camp.fpfsSyncEm && (
                  <span style={{ color: "#6b7280", fontSize: 11, marginLeft: 8 }}>
                    FPFS {format(new Date(camp.fpfsSyncEm), "dd/MM HH:mm")}
                  </span>
                )}
              </div>

              {realizadas.length > 0 && (
                <>
                  <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", color: "#6b7280", marginBottom: 8 }}>Últimos Resultados</h3>
                  <table style={{ marginBottom: 20 }}>
                    <thead><tr><th>Jogo</th><th>Placar</th><th>Rodada</th><th>Data</th><th></th></tr></thead>
                    <tbody>
                      {realizadas.map((p) => (
                        <tr key={p.id}>
                          <td>Itaquerense × {p.adversario}</td>
                          <td className="placar">{p.golsPro} × {p.golsContra}</td>
                          <td>{p.rodada != null ? `${p.rodada}ª` : "—"}</td>
                          <td>{format(new Date(p.data), "dd/MM/yyyy", { locale: ptBR })}</td>
                          <td>{p.sumulaUrl && <a href={p.sumulaUrl} target="_blank" rel="noopener noreferrer" className="sumula-link">Súmula →</a>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {proximas.length > 0 && (
                <>
                  <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", color: "#6b7280", marginBottom: 8 }}>Próximos Jogos</h3>
                  <table style={{ marginBottom: 20 }}>
                    <thead><tr><th>Jogo</th><th>Data</th><th>Local</th></tr></thead>
                    <tbody>
                      {proximas.map((p) => (
                        <tr key={p.id}>
                          <td>Itaquerense × {p.adversario}</td>
                          <td>{format(new Date(p.data), "EEE dd/MM 'às' HH'h'", { locale: ptBR })}</td>
                          <td>{p.local ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {camp.classificacaoFpfs.length > 0 && (
                <>
                  <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", color: "#6b7280", marginBottom: 8 }}>Classificação</h3>
                  <table style={{ marginBottom: 12 }}>
                    <thead><tr><th>#</th><th>Time</th><th>P</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th></tr></thead>
                    <tbody>
                      {camp.classificacaoFpfs.map((l) => (
                        <tr key={l.id} className={l.ehNosso ? "nosso" : ""}>
                          <td>{l.posicao}</td>
                          <td>{l.ehNosso ? "★ " : ""}{l.timeNome}</td>
                          <td style={{ fontWeight: 700 }}>{l.pontos}</td>
                          <td>{l.jogos}</td><td>{l.vitorias}</td><td>{l.empates}</td><td>{l.derrotas}</td>
                          <td>{l.golsPro}</td><td>{l.golsContra}</td>
                          <td>{l.saldo > 0 ? `+${l.saldo}` : l.saldo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              <a href={waHref} target="_blank" rel="noopener noreferrer" className="share-btn">
                Compartilhar no WhatsApp
              </a>
            </div>
          )
        })}

        <footer>
          <Link href="/responsavel">Portal do Responsável</Link>
          <Link href="/matricula">Pré-Matrícula</Link>
          <Link href="/">← Voltar ao site</Link>
        </footer>
      </div>
    </div>
  )
}
