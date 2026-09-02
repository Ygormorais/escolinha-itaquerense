"use client"

import { useState, useTransition } from "react"
import { CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { confirmarLeituraFichaMedica } from "@/app/actions/alunos"
import { Button } from "@/components/ui/button"

export function ConfirmarLeituraFicha({ alunoId, versao, lidaEm }: { alunoId: number; versao: number; lidaEm: string | null }) {
  const [confirmadaEm, setConfirmadaEm] = useState(lidaEm)
  const [pending, startTransition] = useTransition()
  if (confirmadaEm) return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-success-700" title={new Date(confirmadaEm).toLocaleString("pt-BR")}><CheckCircle2 className="size-3" />Ficha lida</span>
  return <Button size="xs" variant="outline" disabled={pending} onClick={() => startTransition(async () => { const resultado = await confirmarLeituraFichaMedica(alunoId, versao); if ("error" in resultado) toast.error(resultado.error); else { setConfirmadaEm(new Date().toISOString()); toast.success("Leitura confirmada.") } })}>{pending ? "Confirmando..." : "Confirmar leitura"}</Button>
}
