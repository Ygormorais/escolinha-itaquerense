import Link from "next/link"
import { Home, SearchX } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 p-6 text-center">
      <div className="flex size-20 items-center justify-center rounded-3xl bg-brand-50">
        <SearchX className="size-10 text-brand-600" />
      </div>
      <div className="space-y-2">
        <h1 className="font-heading text-6xl font-extrabold text-brand-800">404</h1>
        <p className="text-xl font-semibold text-foreground">Página não encontrada</p>
      </div>
      <p className="max-w-sm text-sm text-muted-foreground">
        A página que você está procurando não existe, foi removida ou está temporariamente indisponível.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-xl bg-brand-800 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-900 hover:shadow-xl"
      >
        <Home className="size-4" />
        Voltar ao Dashboard
      </Link>
    </div>
  )
}
