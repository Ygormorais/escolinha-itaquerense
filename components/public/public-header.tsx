import Image from "next/image"
import Link from "next/link"

export function PublicHeader({
  subtitle,
  backHref = "/",
  backLabel = "← Voltar ao site",
}: {
  subtitle: string
  backHref?: string
  backLabel?: string
}) {
  return (
    <header className="pub-hdr">
      <div className="inner">
        <Link href="/" className="brand">
          <Image src="/logo.png" alt="E.C. Itaquerense" width={40} height={40} style={{ borderRadius: 8, flexShrink: 0 }} />
          <div>
            <div className="brand-name">E.C. Itaquerense</div>
            <div className="brand-sub">{subtitle}</div>
          </div>
        </Link>
        <Link href={backHref} className="back">{backLabel}</Link>
      </div>
    </header>
  )
}
