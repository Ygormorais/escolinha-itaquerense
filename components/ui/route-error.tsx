"use client"

import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export function RouteError({ title, reset }: { title: string; reset: () => void }) {
  return <div className="m-4 rounded-xl border border-danger-200 bg-danger-50 p-6 text-danger-800 sm:m-6 lg:m-8"><AlertTriangle className="size-7" /><h1 className="mt-3 font-heading text-xl font-bold">{title}</h1><p className="mt-1 text-sm">Os dados não puderam ser carregados. Sua sessão e alterações já salvas foram preservadas.</p><Button type="button" variant="outline" className="mt-4" onClick={reset}><RefreshCw className="size-4" /> Tentar novamente</Button></div>
}
