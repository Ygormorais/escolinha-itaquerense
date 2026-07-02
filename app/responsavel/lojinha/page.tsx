import { redirect } from "next/navigation"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shirt, ShoppingBag, Package, Phone } from "lucide-react"
import { db } from "@/lib/db"
import Image from "next/image"
import { formatMoney } from "@/lib/utils"
import { PortalHero } from "@/components/responsavel/portal-hero"

function ProdutoIcon({ categoria }: { categoria: string }) {
  if (categoria === "uniforme") return <Shirt className="size-7" />
  if (categoria === "acessorio") return <ShoppingBag className="size-7" />
  return <Package className="size-7" />
}

export const metadata = { title: "Lojinha — Escolinha Itaquerense" }

export default async function LojinhaPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated) redirect("/responsavel/login")

  const [config, produtos] = await Promise.all([
    db.configuracao.findUnique({ where: { chave: "whatsapp" } }),
    db.produto.findMany({
      where: { ativo: true },
      orderBy: { createdAt: "desc" },
    }),
  ])
  const whatsapp = config?.valor ?? "5511999999999"



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
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="size-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum produto disponível no momento.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {produtos.map((p) => (
            <Card key={p.id} className="overflow-hidden">
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
              <CardContent className="p-6">
                <div className="mb-4 flex size-14 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                  <ProdutoIcon categoria={p.categoria} />
                </div>
                <h3 className="font-semibold mb-1">{p.nome}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {p.descricao}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-brand-600">
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

      <Card className="bg-brand-600 text-white">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Phone className="size-5" />
            <h2 className="text-lg font-semibold">Faça seu pedido pelo WhatsApp</h2>
          </div>
          <p className="text-sm text-white/80 mb-4">
            Consulte disponibilidade de tamanhos, formas de pagamento e retirada.
          </p>
          <a
            href={`https://wa.me/${whatsapp}?text=Olá! Tenho interesse nos produtos da lojinha.`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-brand-600 hover:bg-white/90 transition-colors"
          >
            <ShoppingBag className="size-4" /> Quero comprar
          </a>
        </CardContent>
      </Card>
    </div>
  )
}
