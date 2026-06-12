"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { aplicarViradaCategorias } from "@/app/actions/categorias"
import type { ViradaProposta } from "@/lib/categorias"

// On the client boundary, dataNascimento arrives serialized as a string
type ViradaSerializada = Omit<ViradaProposta, "dataNascimento"> & { dataNascimento: string }

export function CategoriasClient({ viradas, anoRef }: { viradas: ViradaSerializada[]; anoRef: number }) {
  // acima do máximo começa desmarcado (decisão humana)
  const [selecionados, setSelecionados] = useState<Set<number>>(
    () => new Set(viradas.filter((v) => !v.acimaDoMaximo).map((v) => v.id))
  )
  const [pending, start] = useTransition()

  function toggle(id: number) {
    setSelecionados((prev) => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })
  }

  function aplicar() {
    const ids = viradas
      .filter((v) => selecionados.has(v.id) && v.turmaProposta != null)
      .map((v) => v.id)
    start(async () => {
      const r = await aplicarViradaCategorias(ids)
      if ("error" in r) toast.error(r.error)
      else toast.success(`${r.aplicadas} aluno(s) promovido(s) de categoria`)
    })
  }

  if (viradas.length === 0) {
    return <p className="text-sm text-muted-foreground">Todas as categorias estão corretas para {anoRef}. 🎉</p>
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead>Aluno</TableHead>
            <TableHead>Nascimento</TableHead>
            <TableHead>Idade em {anoRef}</TableHead>
            <TableHead>Turma atual</TableHead>
            <TableHead>Proposta</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {viradas.map((v) => (
            <TableRow key={v.id}>
              <TableCell>
                <input
                  type="checkbox"
                  checked={selecionados.has(v.id)}
                  disabled={v.turmaProposta == null}
                  onChange={() => toggle(v.id)}
                  aria-label={`Selecionar ${v.nome}`}
                />
              </TableCell>
              <TableCell className="font-medium">{v.nome}</TableCell>
              <TableCell>{format(new Date(v.dataNascimento), "dd/MM/yyyy")}</TableCell>
              <TableCell>{v.idadeNoAno}</TableCell>
              <TableCell>{v.turmaAtual}</TableCell>
              <TableCell>
                {v.turmaProposta ?? <Badge variant="destructive">acima de Sub-máx</Badge>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button onClick={aplicar} disabled={pending || selecionados.size === 0} className="bg-brand-800 text-white hover:bg-brand-900">
        {pending ? "Aplicando..." : `Aplicar virada (${selecionados.size})`}
      </Button>
    </div>
  )
}
