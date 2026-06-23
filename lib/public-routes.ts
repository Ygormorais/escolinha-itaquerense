const PUBLIC_EXACT_ROUTES = new Set([
  "/",
  "/horarios",
  "/resultados",
  "/login",
  "/frequencia/scanner",
])

const PUBLIC_PREFIX_ROUTES = [
  "/matricula",
  "/noticias/publico",
  "/responsavel",
]

export function isPublicRoute(pathname: string): boolean {
  return (
    PUBLIC_EXACT_ROUTES.has(pathname) ||
    PUBLIC_PREFIX_ROUTES.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
    )
  )
}
