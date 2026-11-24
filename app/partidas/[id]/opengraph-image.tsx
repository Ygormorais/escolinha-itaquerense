import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { getPartidaFinalizadaPublica } from "@/lib/site/partidas-dados"
import { dataCurta, iniciaisTime, lerIdPartida } from "@/lib/site/partida-compartilhar"

// Cartão do resultado para WhatsApp, Instagram e Facebook. Só times, placar, categoria e data de
// partida FINALIZADA; qualquer outro caso cai no cartão do clube. O adversário aparece com
// monograma (nada de buscar escudo em site de terceiros durante a geração da imagem).
export const alt = "Resultado da partida do E.C. Itaquerense"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const dynamic = "force-dynamic"

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const id = lerIdPartida((await params).id)
  const p = id === null ? null : await getPartidaFinalizadaPublica(id)
  const logo = await readFile(join(process.cwd(), "public", "logo.png"))
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`

  const placar = p?.placar ?? null
  const nomeCasa = p?.casa ?? "E.C. Itaquerense"
  const nomeFora = p?.fora ?? ""
  const tamanhoNome = Math.max(nomeCasa.length, nomeFora.length) > 18 ? 34 : 44

  const escudo = (nosso: boolean, nome: string) =>
    nosso ? (
      // eslint-disable-next-line @next/next/no-img-element -- ImageResponse não usa next/image
      <img src={logoSrc} width={190} height={190} alt="" />
    ) : (
      <div
        style={{
          width: 190,
          height: 190,
          borderRadius: 95,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2a2a2a",
          border: "6px solid rgba(255,255,255,0.35)",
          fontSize: 78,
          fontWeight: 800,
          color: "#ffffff",
        }}
      >
        {iniciaisTime(nome)}
      </div>
    )

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 72px",
          background: "linear-gradient(135deg, #3d0000 0%, #7f0000 55%, #0b0b0b 100%)",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 32, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
          <span>{p ? p.categoria : "Escolinha de futebol"}</span>
          <span style={{ opacity: 0.85 }}>{p ? dataCurta(p.data) : "Itaquera, São Paulo"}</span>
        </div>

        {p && placar ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 340 }}>
              {escudo(p.nosCasa, p.casa)}
              <div style={{ marginTop: 18, fontSize: tamanhoNome, fontWeight: 800, textAlign: "center", lineHeight: 1.1 }}>{p.casa}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", fontSize: 150, fontWeight: 800 }}>
              <span>{placar[0]}</span>
              <span style={{ margin: "0 28px", fontSize: 90, opacity: 0.7 }}>×</span>
              <span>{placar[1]}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 340 }}>
              {escudo(!p.nosCasa, p.fora)}
              <div style={{ marginTop: 18, fontSize: tamanhoNome, fontWeight: 800, textAlign: "center", lineHeight: 1.1 }}>{p.fora}</div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center" }}>
            {escudo(true, nomeCasa)}
            <div style={{ display: "flex", flexDirection: "column", marginLeft: 48 }}>
              <div style={{ fontSize: 84, fontWeight: 800 }}>E.C. Itaquerense</div>
              <div style={{ fontSize: 34, opacity: 0.9 }}>Resultados e agenda das categorias de base</div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
          {p ? `${p.competicao} · E.C. Itaquerense` : "E.C. Itaquerense · Escolinha de futebol"}
        </div>
      </div>
    ),
    { ...size },
  )
}
