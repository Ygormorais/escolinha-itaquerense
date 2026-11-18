import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "")

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Áreas autenticadas e rotas internas.
        disallow: ["/api/", "/responsavel", "/validar-recibo", "/configuracoes/", "/login", "/alunos/", "/pagamentos/", "/frequencia/", "/caixa/", "/custos/", "/comunicados/", "/campeonatos/", "/uniformes/", "/agenda/", "/secretaria/", "/produtos/", "/avaliacoes/", "/relatorio/", "/historico/", "/recibos/", "/inadimplencia/", "/turmas/", "/buscar", "/uploads/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
