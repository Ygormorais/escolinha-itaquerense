import Image from "next/image"
import Link from "next/link"
import { inter, playfair } from "@/lib/public-fonts"
import { pubBase } from "@/lib/public-css"

const css = `
  ${pubBase("nf")}
  .nf{display:flex;flex-direction:column;align-items:center;justify-content:center;
    padding:40px 24px;text-align:center}

  .nf-logo{width:64px;height:64px;object-fit:contain;margin-bottom:28px;
    filter:drop-shadow(0 4px 12px rgba(198,40,40,.25))}
  .nf-code{
    font-family:var(--font-heading),Georgia,serif;
    font-size:96px;font-weight:800;letter-spacing:-4px;line-height:1;
    color:var(--red);margin-bottom:12px;
    text-shadow:0 4px 24px rgba(198,40,40,.2)
  }
  .nf-title{font-family:var(--font-heading),Georgia,serif;font-size:24px;font-weight:700;
    color:var(--text);margin-bottom:10px}
  .nf-desc{font-size:14px;color:var(--text-muted);max-width:360px;line-height:1.65;margin-bottom:36px}

  .nf-links{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
  .nf-btn{display:inline-flex;align-items:center;gap:8px;padding:12px 24px;
    border-radius:100px;font-size:13px;font-weight:700;letter-spacing:.3px;transition:all .2s}
  .nf-btn.primary{background:var(--red);color:#fff;box-shadow:0 4px 14px rgba(198,40,40,.3)}
  .nf-btn.primary:hover{background:var(--red-dark);transform:translateY(-1px)}
  .nf-btn.secondary{border:1.5px solid var(--border);color:var(--text-muted)}
  .nf-btn.secondary:hover{border-color:var(--red);color:var(--red)}
`

export default function NotFound() {
  return (
    <div className={`${inter.variable} ${playfair.variable} nf`}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <Image src="/logo.png" alt="E.C. Itaquerense" width={64} height={64} className="nf-logo" />
      <div className="nf-code">404</div>
      <h1 className="nf-title">Página não encontrada</h1>
      <p className="nf-desc">
        O endereço que você acessou não existe ou foi removido. Verifique o link ou volte ao início.
      </p>
      <div className="nf-links">
        <Link href="/" className="nf-btn primary">← Voltar ao início</Link>
        <Link href="/matricula" className="nf-btn secondary">Fazer matrícula</Link>
      </div>
    </div>
  )
}
