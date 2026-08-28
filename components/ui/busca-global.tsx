import { useState, useEffect, useTransition, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, User, Loader2, Trophy, UserCircle } from "lucide-react"
import { buscarGlobal } from "@/app/actions/busca"
import { useDebounce } from "@/hooks/use-debounce"

type ResultadoAluno = { id: number; nome: string; turma: string; status: string }
type ResultadoResponsavel = { id: number; nome: string; email: string }
type ResultadoCampeonato = { id: number; nome: string; status: string }

const RESULTADO_VAZIO = {
  alunos: [] as ResultadoAluno[],
  responsaveis: [] as ResultadoResponsavel[],
  campeonatos: [] as ResultadoCampeonato[],
}

export function BuscaGlobal() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const debouncedQuery = useDebounce(query, 300)
  const [resultados, setResultados] = useState(RESULTADO_VAZIO)
  const [selecionado, setSelecionado] = useState(0)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const fechar = useCallback(() => {
    setOpen(false)
    setQuery("")
    setResultados(RESULTADO_VAZIO)
    setSelecionado(0)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === "Escape") fechar()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [fechar])

  useEffect(() => {
    if (!open || debouncedQuery.length < 2) return
    let cancelled = false
    startTransition(async () => {
      const r = await buscarGlobal(debouncedQuery)
      if (!cancelled) {
        setResultados(r)
        setSelecionado(0)
      }
    })
    return () => {
      cancelled = true
    }
  }, [debouncedQuery, open])

  const flatList = [
    ...resultados.alunos.map((a) => ({ type: "aluno" as const, id: a.id, label: a.nome, sub: a.turma, status: a.status })),
    ...resultados.responsaveis.map((r) => ({ type: "responsavel" as const, id: r.id, label: r.nome, sub: r.email, status: null })),
    ...resultados.campeonatos.map((c) => ({ type: "campeonato" as const, id: c.id, label: c.nome, sub: c.status, status: null })),
  ]
  const total = flatList.length

  function navegar(item: (typeof flatList)[0]) {
    fechar()
    if (item.type === "aluno") router.push(`/alunos/${item.id}`)
    if (item.type === "responsavel") router.push(`/configuracoes/responsaveis`)
    if (item.type === "campeonato") router.push(`/campeonatos/${item.id}`)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelecionado((s) => Math.min(s + 1, total - 1)) }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelecionado((s) => Math.max(s - 1, 0)) }
    if (e.key === "Enter" && flatList[selecionado]) navegar(flatList[selecionado])
  }

  function onQueryChange(value: string) {
    setQuery(value)
    if (value.length < 2) {
      setResultados(RESULTADO_VAZIO)
      setSelecionado(0)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Buscar alunos, responsáveis ou campeonatos"
        className="flex w-full min-w-0 items-center gap-2 overflow-hidden rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted"
      >
        <Search className="size-3.5 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-left">Buscar alunos, responsáveis, campeonatos...</span>
        <kbd className="shrink-0 rounded border border-border bg-background px-1 py-0.5 text-[10px] font-mono">⌘K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={fechar} />
          <div className="relative z-10 w-full max-w-md rounded-xl border bg-card shadow-2xl overflow-hidden">
            <div className="flex items-center gap-3 border-b px-4 py-3">
              {pending
                ? <Loader2 className="size-4 shrink-0 text-muted-foreground animate-spin" />
                : <Search className="size-4 shrink-0 text-muted-foreground" />
              }
              <input
                autoFocus
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Buscar pelo nome..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">ESC</kbd>
            </div>

            <div className="max-h-80 overflow-y-auto py-2">
              {query.length < 2 && (
                <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                  Digite ao menos 2 caracteres para buscar
                </p>
              )}
              {query.length >= 2 && !pending && total === 0 && debouncedQuery.length >= 2 && (
                <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                  Nenhum resultado encontrado
                </p>
              )}

              {resultados.alunos.length > 0 && (
                <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Alunos</div>
              )}
              {resultados.alunos.map((r, i) => (
                <button
                  key={`aluno-${r.id}`}
                  onClick={() => navegar(flatList[i])}
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
                    r.status === "Ativo" ? "bg-success-50 text-success-600" : "bg-muted text-muted-foreground"
                  }`}>{r.status}</span>
                </button>
              ))}

              {resultados.responsaveis.length > 0 && (
                <div className="px-4 pt-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-t">Responsáveis</div>
              )}
              {resultados.responsaveis.map((r, idx) => {
                const globalIdx = resultados.alunos.length + idx
                return (
                  <button
                    key={`resp-${r.id}`}
                    onClick={() => navegar(flatList[globalIdx])}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      globalIdx === selecionado ? "bg-brand-50 dark:bg-brand-950" : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-800">
                      <UserCircle className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.nome}</p>
                      <p className="text-xs text-muted-foreground">{r.email}</p>
                    </div>
                  </button>
                )
              })}

              {resultados.campeonatos.length > 0 && (
                <div className="px-4 pt-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-t">Campeonatos</div>
              )}
              {resultados.campeonatos.map((c, idx) => {
                const globalIdx = resultados.alunos.length + resultados.responsaveis.length + idx
                return (
                  <button
                    key={`camp-${c.id}`}
                    onClick={() => navegar(flatList[globalIdx])}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      globalIdx === selecionado ? "bg-brand-50 dark:bg-brand-950" : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-800">
                      <Trophy className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.nome}</p>
                      <p className="text-xs text-muted-foreground capitalize">{c.status}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            {total > 0 && (
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
