import { redirect } from "next/navigation"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shirt, ShoppingBag, Phone } from "lucide-react"
import { db } from "@/lib/db"

export default async function LojinhaPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated) redirect("/responsavel/login")

  const config = await db.configuracao.findUnique({ where: { chave: "whatsapp" } })
  const whatsapp = config?.valor ?? "5511999999999"

  const produtos = [
    { nome: "Camisa Oficial", desc: "Camisa oficial da Escolinha Itaquerense", preco: 89.90, tamanhos: "P, M, G, GG" },
    { nome: "Calção Oficial", desc: "Calção oficial com tecido dry-fit", preco: 49.90, tamanhos: "P, M, G, GG" },
    { nome: "Meião Oficial", desc: "Par de meiões cano longo", preco: 29.90, tamanhos: "Único" },
    { nome: "Jaquetas Corta-Vento", desc: "Jaqueta leve para treinos e dias frios", preco: 119.90, tamanhos: "P, M, G, GG" },
    { nome: "Garrafa Personalizada", desc: "Garrafa squeeze com logo da escolinha", preco: 24.90, tamanhos: "Único" },
    { nome: "Boné", desc: "Boné aba curva bordado", preco: 39.90, tamanhos: "Único" },
  ]

  return (
    <>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <ShoppingBag className="size-6" />
        Lojinha
      </h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {produtos.map((p, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex size-14 items-center justify-center rounded-xl bg-brand-100 text-brand-600 mb-4">
                <Shirt className="size-7" />
              </div>
              <h3 className="font-semibold mb-1">{p.nome}</h3>
              <p className="text-sm text-muted-foreground mb-3">{p.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-brand-600">R$ {p.preco.toFixed(2)}</span>
                <Badge variant="secondary" className="text-[10px]">{p.tamanhos}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
    </>
  )
}
