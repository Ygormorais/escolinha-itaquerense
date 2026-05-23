import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100">
        <span className="font-heading text-2xl font-bold text-brand-800">EI</span>
      </div>
      <h1 className="font-heading text-4xl font-bold text-brand-900">404</h1>
      <p className="text-lg font-medium text-foreground">Página não encontrada</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        A página que você está procurando não existe ou foi movida.
      </p>
      <Button asChild className="bg-brand-800 text-white hover:bg-brand-900">
        <Link href="/">
          <Home className="size-4" />
          Voltar ao Dashboard
        </Link>
      </Button>
    </div>
  )
}
