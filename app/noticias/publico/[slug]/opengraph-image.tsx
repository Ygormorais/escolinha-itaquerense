import { ImageResponse } from "next/og"
import { getNoticiaPublicada } from "@/lib/noticias/dados"

// Cartão de compartilhamento (WhatsApp, Instagram, Facebook) das notícias sem foto própria.
// Só usa título e categoria de matéria PUBLICADA; rascunho cai no cartão genérico do clube.
export const alt = "Notícia do E.C. Itaquerense"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const dynamic = "force-dynamic"

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const n = await getNoticiaPublicada(slug)
  const titulo = n?.titulo ?? "E.C. Itaquerense"
  const categoria = n?.categoria ?? "Escolinha de futebol"
  // Título longo encolhe para caber em até 4 linhas sem estourar o cartão.
  const fonte = titulo.length > 110 ? 48 : titulo.length > 70 ? 58 : 70

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0B0B0B",
          color: "#FFFFFF",
          padding: "64px 72px",
          borderLeft: "20px solid #C62828",
        }}
      >
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            background: "#C62828",
            color: "#FFFFFF",
            fontSize: 30,
            fontWeight: 700,
            padding: "8px 22px",
            borderRadius: 6,
          }}
        >
          {categoria}
        </div>
        <div style={{ display: "flex", fontSize: fonte, fontWeight: 800, lineHeight: 1.12, letterSpacing: -1 }}>
          {titulo}
        </div>
        <div style={{ display: "flex", fontSize: 32, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>
          E.C. Itaquerense · Escolinha de futebol
        </div>
      </div>
    ),
    { ...size },
  )
}
