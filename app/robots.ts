import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/responsavel/", "/responsavel"],
        disallow: ["/api/", "/configuracoes/", "/login", "/alunos/", "/pagamentos/", "/frequencia/", "/caixa/", "/custos/", "/comunicados/", "/campeonatos/", "/uniformes/", "/agenda/", "/secretaria/", "/produtos/", "/avaliacoes/", "/relatorio/", "/historico/", "/recibos/", "/inadimplencia/", "/turmas/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
