"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Search, User, Loader2 } from "lucide-react"
import { buscarAlunos } from "@/app/actions/busca"

type Resultado = { id: number; nome: string; turma: string; status: string }

export function BuscaGlobal() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [selecionado, setSelecionado] = useState(0)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  // Ctrl+K / Cmd+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    if (!open) { setQuery(""); setResultados([]); setSelecionado(0) }
  }, [open])

  useEffect(() => {
    if (query.length < 2) { setResultados([]); return }
    startTransition(async () => {
      const r = await buscarAlunos(query)
      setResultados(r)
      setSelecionado(0)
    })
  }, [query])

  function navegar(id: number) {
    setOpen(false)
    router.push(`/alunos/${id}`)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelecionado((s) => Math.min(s + 1, resultados.length - 1)) }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelecionado((s) => Math.max(s - 1, 0)) }
    if (e.key === "Enter" && resultados[selecionado]) navegar(resultados[selecionado].id)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted"
      >
        <Search className="size-3.5 shrink-0" />
        <span className="flex-1 text-left">Buscar aluno...</span>
        <kbd className="rounded border border-border bg-background px-1 py-0.5 text-[10px] font-mono">⌘K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-xl border bg-card shadow-2xl overflow-hidden">
            <div className="flex items-center gap-3 border-b px-4 py-3">
              {pending
                ? <Loader2 className="size-4 shrink-0 text-muted-foreground animate-spin" />
                : <Search className="size-4 shrink-0 text-muted-foreground" />
              }
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Buscar aluno pelo nome..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">ESC</kbd>
            </div>

            <div className="max-h-72 overflow-y-auto py-2">
              {query.length < 2 && (
                <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                  Digite ao menos 2 caracteres para buscar
                </p>
              )}
              {query.length >= 2 && !pending && resultados.length === 0 && (
                <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                  Nenhum aluno encontrado
                </p>
              )}
              {resultados.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => navegar(r.id)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    i === selecionado ? "bg-brand-50 dark:bg-brand-950" : "hover:bg-muted"
                  }`}
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-800">
                    <User className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.nome}</p>
                    <p className="text-xs text-muted-foreground">{r.turma}</p>
                  </div>
                  <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                    r.status === "Ativo"
                      ? "bg-success-50 text-success-600"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {r.status}
                  </span>
                </button>
              ))}
            </div>

            {resultados.length > 0 && (
              <div className="border-t px-4 py-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                <span><kbd className="font-mono">↑↓</kbd> navegar</span>
                <span><kbd className="font-mono">↵</kbd> abrir</span>
                <span><kbd className="font-mono">esc</kbd> fechar</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
