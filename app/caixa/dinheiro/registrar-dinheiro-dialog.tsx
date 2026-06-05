"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { PlusIcon, Banknote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { toast } from "sonner"
import { criarRecebimento } from "@/app/actions/recebimentos"
import { registrarPagamento, getPagamentosPendentes } from "@/app/actions/pagamentos"

const CATEGORIAS = ["Uniforme", "Evento", "Doação", "Outros"]

type Aluno = { id: number; nome: string }
type PagamentoPendente = {
  id: number
  mesReferencia: string
  dataVencimento: Date | string
  aluno: { mensalidade: number }
}

type Modo = "avulso" | "mensalidade"

export function RegistrarDinheiroDialog({ alunos }: { alunos: Aluno[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [modo, setModo] = useState<Modo>("avulso")
  const [pending, start] = useTransition()

  const hoje = format(new Date(), "yyyy-MM-dd")

  // --- Avulso ---
  const [descricao, setDescricao] = useState("")
  const [categoria, setCategoria] = useState("Uniforme")
  const [valorAvulso, setValorAvulso] = useState("")
  const [dataAvulso, setDataAvulso] = useState(hoje)

  // --- Mensalidade ---
  const [alunoId, setAlunoId] = useState<string>("")
  const [pendentes, setPendentes] = useState<PagamentoPendente[]>([])
  const [pagamentoId, setPagamentoId] = useState<string>("")
  const [valorMens, setValorMens] = useState("")
  const [dataMens, setDataMens] = useState(hoje)

  function reset() {
    setDescricao(""); setCategoria("Uniforme"); setValorAvulso(""); setDataAvulso(hoje)
    setAlunoId(""); setPendentes([]); setPagamentoId(""); setValorMens(""); setDataMens(hoje)
    setModo("avulso")
  }

  async function handleAlunoChange(id: string) {
    setAlunoId(id)
    setPagamentoId("")
    setValorMens("")
    const lista = await getPagamentosPendentes(Number(id))
    setPendentes(lista)
  }

  function handlePagamentoChange(id: string) {
    setPagamentoId(id)
    const p = pendentes.find((x) => String(x.id) === id)
    if (p) setValorMens(String(p.aluno.mensalidade))
  }

  function handleSubmit() {
    start(async () => {
      if (modo === "avulso") {
        const res = await criarRecebimento({
          data: dataAvulso,
          descricao,
          categoria,
          valor: Number(valorAvulso),
          formaPagamento: "Dinheiro",
        })
        if ("error" in res) { toast.error(res.error); return }
        toast.success("Recebimento registrado")
      } else {
        if (!pagamentoId) { toast.error("Selecione o mês de referência"); return }
        const res = await registrarPagamento(Number(pagamentoId), {
          dataPagamento: dataMens,
          formaPagamento: "Dinheiro",
          valorRecebido: Number(valorMens),
        })
        if ("error" in res) { toast.error(res.error); return }
        toast.success("Mensalidade recebida em dinheiro")
      }
      reset()
      setOpen(false)
      router.refresh()
    })
  }

  const podeSalvar =
    modo === "avulso"
      ? descricao.trim() !== "" && Number(valorAvulso) > 0
      : pagamentoId !== "" && Number(valorMens) > 0

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset() }}>
      <div onClick={() => setOpen(true)}>
        <Button className="bg-brand-800 text-white hover:bg-brand-900">
          <PlusIcon className="size-4" />
          Registrar recebimento
        </Button>
      </div>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="size-5 text-success-600" />
            Recebimento em Dinheiro
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={modo === "avulso" ? "default" : "outline"}
            onClick={() => setModo("avulso")}
            className={modo === "avulso" ? "bg-brand-800 text-white hover:bg-brand-900" : ""}
          >
            Entrada avulsa
          </Button>
          <Button
            type="button"
            variant={modo === "mensalidade" ? "default" : "outline"}
            onClick={() => setModo("mensalidade")}
            className={modo === "mensalidade" ? "bg-brand-800 text-white hover:bg-brand-900" : ""}
          >
            Mensalidade de aluno
          </Button>
        </div>

        {modo === "avulso" ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label>Descrição</Label>
              <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: Venda de uniforme" />
            </div>
            <div className="space-y-1">
              <Label>Categoria</Label>
              <Select value={categoria} onValueChange={(v) => setCategoria(v ?? "")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" value={valorAvulso} onChange={(e) => setValorAvulso(e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Data</Label>
              <Input type="date" value={dataAvulso} onChange={(e) => setDataAvulso(e.target.value)} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label>Aluno</Label>
              <Select value={alunoId} onValueChange={(v) => handleAlunoChange(v ?? "")}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
                <SelectContent>
                  {alunos.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Mês de referência</Label>
              <Select value={pagamentoId} onValueChange={(v) => handlePagamentoChange(v ?? "")} disabled={!alunoId || pendentes.length === 0}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={!alunoId ? "Selecione um aluno primeiro" : pendentes.length === 0 ? "Sem mensalidades pendentes" : "Selecione o mês"} />
                </SelectTrigger>
                <SelectContent>
                  {pendentes.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.mesReferencia}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" value={valorMens} onChange={(e) => setValorMens(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Data</Label>
              <Input type="date" value={dataMens} onChange={(e) => setDataMens(e.target.value)} />
            </div>
          </div>
        )}

        <DialogFooter showCloseButton>
          <Button onClick={handleSubmit} disabled={pending || !podeSalvar} className="bg-brand-800 text-white hover:bg-brand-900">
            {pending ? "Salvando..." : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
