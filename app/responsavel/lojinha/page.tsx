import { redirect } from "next/navigation"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shirt, ShoppingBag, Package, Phone } from "lucide-react"
import { db } from "@/lib/db"
import Image from "next/image"
import { formatMoney } from "@/lib/utils"
import { PortalHero } from "@/components/responsavel/portal-hero"
import { EmptyState } from "@/components/ui/empty-state"
import { getConfig } from "@/lib/config"

function ProdutoIcon({ categoria }: { categoria: string }) {
  if (categoria === "uniforme") return <Shirt className="size-7" />
  if (categoria === "acessorio") return <ShoppingBag className="size-7" />
  return <Package className="size-7" />
}

export const metadata = { title: "Lojinha — Escolinha Itaquerense" }

export default async function LojinhaPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated) redirect("/responsavel/login")

  const [produtos, config] = await Promise.all([
    db.produto.findMany({
      where: { ativo: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nome: true,
        descricao: true,
        preco: true,
        categoria: true,
        tamanhos: true,
        imagem: true,
      },
      take: 60,
    }),
    Promise.resolve(getConfig()),
  ])
  const whatsapp = config.whatsapp || "5511999999999"

  return (
    <div className="flex flex-col gap-8">
      <PortalHero
        backHref="/responsavel"
        title="Lojinha"
        description="Uniformes e acessórios oficiais da escolinha, com valores e tamanhos disponíveis para consulta rápida."
        stats={[
          { label: "Produtos", value: produtos.length },
          { label: "Categorias", value: new Set(produtos.map((produto) => produto.categoria)).size },
          { label: "Pedidos", value: "WhatsApp" },
        ]}
      />

      {produtos.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nenhum produto disponível"
          description="Quando a lojinha tiver itens ativos, eles aparecem aqui para consulta e pedido."
          href="/responsavel"
          hrefLabel="Voltar ao portal"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {produtos.map((p) => (
            <Card key={p.id} className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md">
              <div className="relative aspect-[4/3] overflow-hidden border-b border-black/5 bg-[var(--color-paper-100)]">
                {p.imagem ? (
                  <Image
                    src={p.imagem}
                    alt={p.nome}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-300 hover:scale-[1.03]"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-brand-600">
                    <ProdutoIcon categoria={p.categoria} />
                  </div>
                )}
              </div>
              <CardContent className="p-5">
                <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                  <ProdutoIcon categoria={p.categoria} />
                </div>
                <h3 className="mb-1 font-heading text-base font-extrabold tracking-tight">{p.nome}</h3>
                {p.descricao && (
                  <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{p.descricao}</p>
                )}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-heading text-lg font-extrabold tabular-nums text-brand-600">
                    {formatMoney(p.preco)}
                  </span>
                  {p.tamanhos && (
                    <Badge variant="secondary" className="text-[10px]">
                      {p.tamanhos}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,_#4A0B0B_0%,_#C62828_55%,_#D84040_100%)] text-white shadow-lg">
        <CardContent className="p-6 text-center sm:p-8">
          <div className="mb-2 flex items-center justify-center gap-2">
            <Phone className="size-5 opacity-90" />
            <h2 className="font-heading text-lg font-extrabold">Faça seu pedido pelo WhatsApp</h2>
          </div>
          <p className="mb-5 text-sm text-white/80">
            Consulte disponibilidade de tamanhos, formas de pagamento e retirada.
          </p>
          <a
            href={`https://wa.me/${whatsapp}?text=Olá! Tenho interesse nos produtos da lojinha.`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-brand-700 shadow-sm transition-colors hover:bg-white/90"
          >
            <ShoppingBag className="size-4" /> Quero comprar
          </a>
        </CardContent>
      </Card>
    </div>
  )
}
