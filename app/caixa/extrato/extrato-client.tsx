"use client"

import { useRef, useState, useTransition } from "react"
import { toast } from "sonner"
import { Upload, TrendingUp, TrendingDown, Minus, Trash2, EyeOff, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { importarExtrato, ignorarLancamento, deletarLancamento, categorizarLancamento } from "@/app/actions/extrato"
import { formatMoney } from "@/lib/utils"

const CATEGORIAS = [
  { value: "mensalidade", label: "Mensalidade" },
  { value: "custo_operacional", label: "Custo Operacional" },
  { value: "transferencia", label: "Transferência" },
  { value: "imposto", label: "Imposto/Taxa" },
  { value: "outro", label: "Outro" },
]

interface Lancamento {
  id: number
  data: Date
  descricao: string
  valor: number
  tipo: string
  saldo: number | null
  banco: string | null
  arquivo: string
  status: string
  categoria: string | null
}

interface Resumo {
  totalEntradas: number
  totalSaidas: number
  saldo: number
  qtdEntradas: number
  qtdSaidas: number
  total: number
}

interface Props {
  lancamentos: Lancamento[]
  resumo: Resumo
  mes: string
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export function ExtratoClient({ lancamentos: initial, resumo: initialResumo, mes }: Props) {
  const [lancamentos, setLancamentos] = useState(initial)
  const [resumo, setResumo] = useState(initialResumo)
  const [filtroTipo, setFiltroTipo] = useState("todos")
  const [filtroStatus, setFiltroStatus] = useState("todos")
  const [filtroCategoria, setFiltroCategoria] = useState("todas")
  const [isDragging, setIsDragging] = useState(false)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.name.match(/\.(csv|txt|ofx)$/i)) {
      toast.error("Envie um arquivo CSV ou OFX do seu banco")
      return
    }
    const texto = await file.text()
    startTransition(async () => {
      const res = await importarExtrato(texto, file.name)
      if ("error" in res) { toast.error(res.error); return }
      toast.success(`${res.importados} lançamentos importados de ${res.banco}`)
      if (res.ignorados > 0) toast.info(`${res.ignorados} duplicatas ignoradas`)
      window.location.reload()
    })
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
    e.target.value = ""
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setIsDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  async function handleIgnorar(id: number) {
    startTransition(async () => {
      await ignorarLancamento(id)
      setLancamentos((prev) => prev.map((l) => l.id === id ? { ...l, status: "ignorado" } : l))
    })
  }

  async function handleCategorizar(id: number, categoria: string) {
    startTransition(async () => {
      await categorizarLancamento(id, categoria)
      setLancamentos((prev) => prev.map((l) => l.id === id ? { ...l, categoria: categoria || null } : l))
    })
  }

  async function handleDeletar(id: number) {
    if (!confirm("Remover este lançamento?")) return
    startTransition(async () => {
      await deletarLancamento(id)
      setLancamentos((prev) => prev.filter((l) => l.id !== id))
    })
  }

  const filtrados = lancamentos.filter((l) => {
    if (filtroTipo !== "todos" && l.tipo !== filtroTipo) return false
    if (filtroStatus !== "todos" && l.status !== filtroStatus) return false
    if (filtroCategoria !== "todas" && l.categoria !== filtroCategoria) return false
    return true
  })

  // agrupa por data para visual de extrato
  const porData = filtrados.reduce<Record<string, Lancamento[]>>((acc, l) => {
    const k = new Date(l.data).toISOString().slice(0, 10)
    ;(acc[k] = acc[k] ?? []).push(l)
    return acc
  }, {})
  const datasOrdenadas = Object.keys(porData).sort((a, b) => b.localeCompare(a))

  const saldoCor = resumo.saldo >= 0 ? "text-success-600" : "text-destructive"

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Entradas</p>
          <p className="mt-1 font-heading text-2xl font-extrabold tracking-tight text-success-600">
            {formatMoney(resumo.totalEntradas)}
          </p>
          <p className="text-xs text-muted-foreground">{resumo.qtdEntradas} lançamentos</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Saídas</p>
          <p className="mt-1 font-heading text-2xl font-extrabold tracking-tight text-destructive">
            {formatMoney(resumo.totalSaidas)}
          </p>
          <p className="text-xs text-muted-foreground">{resumo.qtdSaidas} lançamentos</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Saldo do período</p>
          <p className={`mt-1 font-heading text-2xl font-extrabold tracking-tight ${saldoCor}`}>
            {formatMoney(resumo.saldo)}
          </p>
          <p className="text-xs text-muted-foreground">{resumo.total} lançamentos no total</p>
        </div>
      </div>

      {/* Upload */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors
          ${isDragging ? "border-brand-400 bg-brand-50/60" : "border-border hover:border-brand-300 hover:bg-muted/30"}`}
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Upload className="size-5" />
        </div>
        <div>
          <p className="font-semibold text-foreground">
            {isPending ? "Importando…" : "Arraste o extrato ou clique para selecionar"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            CSV do Nubank, Itaú, Bradesco, Santander, BB — ou qualquer banco com colunas Data/Valor
          </p>
        </div>
        <input ref={fileRef} type="file" accept=".csv,.txt,.ofx" className="hidden" onChange={onFileChange} />
      </div>

      {/* Filtros */}
      {lancamentos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {["todos", "entrada", "saida"].map((f) => (
            <button
              key={f}
              onClick={() => setFiltroTipo(f)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors
                ${filtroTipo === f
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
            >
              {f === "todos" ? "Todos" : f === "entrada" ? "Entradas" : "Saídas"}
            </button>
          ))}
          <span className="mx-1 text-border">|</span>
          {["todos", "novo", "ignorado"].map((f) => (
            <button
              key={f}
              onClick={() => setFiltroStatus(f)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors
                ${filtroStatus === f
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
            >
              {f === "todos" ? "Todos" : f === "novo" ? "Novos" : "Ignorados"}
            </button>
          ))}
          <span className="mx-1 text-border">|</span>
          <button
            onClick={() => setFiltroCategoria("todas")}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${filtroCategoria === "todas" ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
          >
            Todas categorias
          </button>
          {CATEGORIAS.map((c) => (
            <button
              key={c.value}
              onClick={() => setFiltroCategoria(c.value)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${filtroCategoria === c.value ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Lista tipo extrato */}
      {datasOrdenadas.length === 0 && lancamentos.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
          <p className="font-semibold">Nenhum extrato importado</p>
          <p className="mt-1 text-sm">Faça o upload do CSV do seu banco acima</p>
        </div>
      )}

      {datasOrdenadas.map((data) => {
        const itens = porData[data]
        const entDia = itens.filter((l) => l.tipo === "entrada").reduce((s, l) => s + l.valor, 0)
        const saiDia = itens.filter((l) => l.tipo === "saida").reduce((s, l) => s + Math.abs(l.valor), 0)

        return (
          <div key={data} className="space-y-1">
            {/* Cabeçalho do dia */}
            <div className="flex items-center justify-between py-1">
              <span className="text-xs font-semibold text-muted-foreground">
                {new Date(data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" }).replace(".", "")}
              </span>
              <div className="flex gap-3 text-xs">
                {entDia > 0 && <span className="text-success-600">+{formatMoney(entDia)}</span>}
                {saiDia > 0 && <span className="text-destructive">−{formatMoney(saiDia)}</span>}
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              {itens.map((l, i) => (
                <div
                  key={l.id}
                  className={`group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30
                    ${i > 0 ? "border-t border-border/60" : ""}
                    ${l.status === "ignorado" ? "opacity-40" : ""}`}
                >
                  {/* Ícone tipo */}
                  <div className={`flex size-8 shrink-0 items-center justify-center rounded-full
                    ${l.tipo === "entrada" ? "bg-success-50 text-success-600" : "bg-red-50 text-destructive"}`}>
                    {l.tipo === "entrada"
                      ? <TrendingUp className="size-4" />
                      : <TrendingDown className="size-4" />}
                  </div>

                  {/* Descrição */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{l.descricao}</p>
                    <p className="text-xs text-muted-foreground">{l.banco ?? l.arquivo}</p>
                  </div>

                  {/* Categoria */}
                  <select
                    value={l.categoria ?? ""}
                    onChange={(e) => handleCategorizar(l.id, e.target.value)}
                    className="hidden shrink-0 rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-brand-400 focus:outline-none group-hover:block sm:block"
                  >
                    <option value="">Categorizar…</option>
                    {CATEGORIAS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>

                  {/* Saldo */}
                  {l.saldo != null && (
                    <span className="hidden text-xs text-muted-foreground sm:block">
                      saldo {formatMoney(l.saldo)}
                    </span>
                  )}

                  {/* Valor */}
                  <span className={`shrink-0 font-semibold tabular-nums
                    ${l.tipo === "entrada" ? "text-success-600" : "text-destructive"}`}>
                    {l.tipo === "entrada" ? "+" : "−"}{formatMoney(Math.abs(l.valor))}
                  </span>

                  {/* Ações */}
                  <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {l.status !== "ignorado" && (
                      <button
                        onClick={() => handleIgnorar(l.id)}
                        title="Ignorar"
                        aria-label="Ignorar lançamento"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <EyeOff className="size-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeletar(l.id)}
                      title="Remover"
                      aria-label="Remover lançamento"
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
