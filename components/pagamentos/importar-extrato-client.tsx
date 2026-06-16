"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Loader2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { previewOFX, confirmarImportacaoOFX } from "@/app/actions/importar-extrato"
import type { MatchResult } from "@/lib/ofx-matcher"

type Fase = "upload" | "preview"

export function ImportarExtratoClient() {
  const [fase, setFase] = useState<Fase>("upload")
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [resultados, setResultados] = useState<MatchResult[]>([])
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isConfirming, startConfirm] = useTransition()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setArquivo(e.target.files?.[0] ?? null)
  }

  function handleAnalisar() {
    if (!arquivo) return
    setIsPreviewing(true)
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string
        const result = await previewOFX(content)
        setIsPreviewing(false)
        if ("error" in result) {
          toast.error(result.error)
          return
        }
        const alta = result
          .filter((r) => r.confianca === "alta")
          .map((r) => r.fitid)
        setSelecionados(new Set(alta))
        setResultados(result)
        setFase("preview")
      } catch {
        setIsPreviewing(false)
        toast.error("Erro ao processar o arquivo")
      }
    }
    reader.onerror = () => {
      setIsPreviewing(false)
      toast.error("Erro ao ler o arquivo")
    }
    reader.readAsText(arquivo, "latin1")
  }

  function toggleSelecionado(fitid: string) {
    setSelecionados((prev) => {
      const next = new Set(prev)
      if (next.has(fitid)) next.delete(fitid)
      else next.add(fitid)
      return next
    })
  }

  function handleConfirmar() {
    const selecoes = resultados
      .filter((r) => selecionados.has(r.fitid) && r.pagamentoId !== null)
      .map((r) => ({
        pagamentoId: r.pagamentoId!,
        valor: r.amount,
        dataPagamento: r.date.toISOString().slice(0, 10),
      }))

    if (selecoes.length === 0) return

    startConfirm(async () => {
      const result = await confirmarImportacaoOFX(selecoes)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success(`${result.atualizados} pagamento(s) registrado(s)`)
      setFase("upload")
      setArquivo(null)
      setResultados([])
      setSelecionados(new Set())
    })
  }

  const totalSelecionados = resultados.filter(
    (r) => selecionados.has(r.fitid) && r.pagamentoId !== null
  ).length

  if (fase === "upload") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Faça upload do arquivo OFX exportado do seu banco para marcar mensalidades como pagas em lote.
        </p>
        <div className="flex flex-col gap-3 max-w-sm">
          <label className="text-sm font-medium" htmlFor="ofx-file">
            Arquivo OFX
          </label>
          <input
            id="ofx-file"
            type="file"
            accept=".ofx,.ofc"
            onChange={handleFileChange}
            className="text-sm file:mr-4 file:rounded-md file:border-0 file:bg-brand-800 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-brand-900"
          />
          <Button
            onClick={handleAnalisar}
            disabled={!arquivo || isPreviewing}
            className="w-fit"
          >
            {isPreviewing ? (
              <><Loader2 className="size-4 animate-spin" /> Analisando...</>
            ) : (
              <><Upload className="size-4" /> Analisar</>
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {resultados.length} transação(ões) encontrada(s). Confirme as que deseja registrar.
      </p>
      <div className="overflow-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="px-3 py-2">Data</th>
              <th className="px-3 py-2">Descrição</th>
              <th className="px-3 py-2 text-right">Valor</th>
              <th className="px-3 py-2">Aluno</th>
              <th className="px-3 py-2">Mês</th>
              <th className="px-3 py-2 text-center">Incluir</th>
            </tr>
          </thead>
          <tbody>
            {resultados.map((r) => (
              <tr
                key={r.fitid}
                className={
                  r.confianca === "nenhuma"
                    ? "opacity-50"
                    : r.confianca === "baixa"
                    ? "bg-yellow-50"
                    : ""
                }
              >
                <td className="px-3 py-2 whitespace-nowrap">
                  {format(r.date, "dd/MM/yyyy", { locale: ptBR })}
                </td>
                <td className="px-3 py-2 max-w-xs truncate">{r.memo}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  {r.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </td>
                <td className="px-3 py-2">
                  {r.alunoNome ?? <span className="text-muted-foreground">não identificado</span>}
                </td>
                <td className="px-3 py-2">
                  {r.mesReferencia ?? "—"}
                  {r.confianca === "baixa" && (
                    <span className="ml-1 text-xs text-yellow-700">verificar</span>
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={selecionados.has(r.fitid)}
                    disabled={r.confianca === "nenhuma" || r.pagamentoId === null}
                    onChange={() => toggleSelecionado(r.fitid)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setFase("upload")}>
          Voltar
        </Button>
        <Button
          onClick={handleConfirmar}
          disabled={totalSelecionados === 0 || isConfirming}
        >
          {isConfirming ? (
            <><Loader2 className="size-4 animate-spin" /> Salvando...</>
          ) : (
            `Confirmar ${totalSelecionados} pagamento(s)`
          )}
        </Button>
      </div>
    </div>
  )
}
