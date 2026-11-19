const PUBLIC_EXACT_ROUTES = new Set([
  "/",
  "/horarios",
  "/resultados",
  "/partidas",
  "/buscar",
  "/login",
  "/privacidade",
  "/termos",
  "/frequencia/scanner",
])

const PUBLIC_PREFIX_ROUTES = [
  "/matricula",
  "/noticias/publico",
  "/responsavel",
  "/validar-recibo",
]

export function isPublicRoute(pathname: string): boolean {
  return (
    PUBLIC_EXACT_ROUTES.has(pathname) ||
    PUBLIC_PREFIX_ROUTES.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
    )
  )
}

/**
 * Prefixos de rotas que existem no app e exigem sessão (admin/equipe) ou são
 * tratadas por handlers com autenticação própria. Qualquer caminho que NÃO
 * casa com rota pública nem com um destes prefixos não existe: o proxy o deixa
 * passar para o Next responder 404 (app/not-found.tsx) em vez de mandar o
 * visitante ao /login.
 *
 * Ao criar uma pasta nova em app/, inclua-a aqui (ou deixe-a pública em
 * isPublicPath): o teste lib/__tests__/public-routes.test.ts compara com o
 * diretório app/ e falha se houver pasta sem classificação.
 */
export const PRIVATE_APP_PREFIXES = [
  "/agenda",
  "/alunos",
  "/api", // toda a API: o que for público está em isPublicPath; o resto exige sessão
  "/avaliacoes",
  "/caixa",
  "/campeonatos",
  "/comunicados",
  "/configuracoes",
  "/custos",
  "/dashboard",
  "/desenvolvimento",
  "/frequencia",
  "/historico",
  "/inadimplencia",
  "/noticias",
  "/pagamentos",
  "/pendencias",
  "/produtos",
  "/recibos",
  "/relatorio",
  "/secretaria",
  "/tecnico",
  "/turmas",
  "/uniformes",
  "/uploads", // arquivos privados (documentos, comprovantes); fotos/mídia públicas já saem antes
] as const

/** True quando o caminho pertence a uma área privada conhecida do app. */
export function isPrivateAppPath(pathname: string): boolean {
  return PRIVATE_APP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  )
}
