import { redirect } from "next/navigation"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shirt, ShoppingBag, Package, Phone, ArrowLeft, Tags } from "lucide-react"
import { db } from "@/lib/db"
import Image from "next/image"
import Link from "next/link"

function ProdutoIcon({ categoria }: { categoria: string }) {
  if (categoria === "uniforme") return <Shirt className="size-7" />
  if (categoria === "acessorio") return <ShoppingBag className="size-7" />
  return <Package className="size-7" />
}

export const metadata = { title: "Lojinha — Escolinha Itaquerense" }

export default async function LojinhaPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated) redirect("/responsavel/login")

  const config = await db.configuracao.findUnique({ where: { chave: "whatsapp" } })
  const whatsapp = config?.valor ?? "5511999999999"

  const produtos = await db.produto.findMany({
    where: { ativo: true },
    orderBy: { createdAt: "desc" },
  })

  const formatPreco = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  return (
    <div className="flex flex-col gap-8">
      <section className="overflow-hidden rounded-3xl border border-black/5 bg-[linear-gradient(135deg,_rgba(127,0,0,0.96)_0%,_rgba(183,28,28,0.92)_55%,_rgba(229,57,53,0.82)_100%)] px-6 py-7 text-white shadow-lg sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-4">
            <Link href="/responsavel" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white/90 transition-colors hover:bg-white/16">
              <ArrowLeft className="size-4" />
              Voltar ao portal
            </Link>
            <div className="space-y-2">
              <h1 className="flex items-center gap-3 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
                <ShoppingBag className="size-8" />
                Lojinha
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-white/78 sm:text-[15px]">
                Uniformes e acessórios oficiais da escolinha, com valores e tamanhos disponíveis para consulta rápida.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-xl border border-white/14 bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Produtos</p>
              <p className="mt-2 text-2xl font-bold">{produtos.length}</p>
            </div>
            <div className="rounded-xl border border-white/14 bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Categorias</p>
              <p className="mt-2 text-2xl font-bold">{new Set(produtos.map((produto) => produto.categoria)).size}</p>
            </div>
            <div className="rounded-xl border border-white/14 bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Pedidos</p>
              <p className="mt-2 flex items-center gap-2 text-2xl font-bold">
                <Tags className="size-5" />
                WhatsApp
              </p>
            </div>
          </div>
        </div>
      </section>

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
                    {formatPreco(p.preco)}
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

      <Card className="mt-8 bg-brand-600 text-white">
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
