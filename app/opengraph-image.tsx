import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

// Prévia de compartilhamento (WhatsApp, Instagram, Facebook): 1200x630, leve
// (poucas dezenas de KB), gerada no build. Substitui o logo quadrado de 650 KB.
export const alt = "Escolinha de Futsal E.C. Itaquerense — Itaquera, São Paulo"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  const logo = await readFile(join(process.cwd(), "public", "logo.png"))
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          padding: "0 90px",
          background: "linear-gradient(135deg, #3d0000 0%, #7f0000 55%, #0b0b0b 100%)",
          color: "#ffffff",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse não usa next/image */}
        <img src={logoSrc} width={340} height={340} alt="" style={{ marginRight: 70 }} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 30, letterSpacing: 4, textTransform: "uppercase", opacity: 0.85 }}>
            Escolinha de Futsal
          </div>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05, marginTop: 14 }}>
            E.C. Itaquerense
          </div>
          <div style={{ fontSize: 34, marginTop: 28, opacity: 0.9 }}>
            Itaquera, São Paulo — SP
          </div>
          <div
            style={{
              marginTop: 36,
              display: "flex",
              fontSize: 28,
              fontWeight: 700,
              padding: "12px 28px",
              borderRadius: 999,
              background: "#ffffff",
              color: "#7f0000",
              alignSelf: "flex-start",
            }}
          >
            Faça a pré-matrícula online
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
