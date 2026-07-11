"use client"

import { useState, useTransition } from "react"
import { Heart, Pencil, X, Check, AlertTriangle, Phone } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { salvarFichaMedica } from "@/app/actions/alunos"

const TIPOS_SANGUINEOS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
const PARENTESCOS = ["Mãe", "Pai", "Avó", "Avô", "Tio(a)", "Irmão/Irmã", "Outro"]

type Props = {
  alunoId: number
  tipoSanguineo: string | null
  alergias: string | null
  condicaoSaude: string | null
  contatoEmergenciaNome: string | null
  contatoEmergenciaTel: string | null
  contatoEmergenciaParentesco: string | null
}

export function FichaMedicaCard(props: Props) {
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()

  const [form, setForm] = useState({
    tipoSanguineo: props.tipoSanguineo ?? "",
    alergias: props.alergias ?? "",
    condicaoSaude: props.condicaoSaude ?? "",
    contatoEmergenciaNome: props.contatoEmergenciaNome ?? "",
    contatoEmergenciaTel: props.contatoEmergenciaTel ?? "",
    contatoEmergenciaParentesco: props.contatoEmergenciaParentesco ?? "",
  })

  const temDados = props.tipoSanguineo || props.alergias || props.condicaoSaude || props.contatoEmergenciaNome

  function handleSave() {
    startTransition(async () => {
      const result = await salvarFichaMedica(props.alunoId, form)
      if ("error" in result) {
        toast.error(result.error)
      } else {
        toast.success("Ficha médica atualizada")
        setEditing(false)
      }
    })
  }

  function handleCancel() {
    setForm({
      tipoSanguineo: props.tipoSanguineo ?? "",
      alergias: props.alergias ?? "",
      condicaoSaude: props.condicaoSaude ?? "",
      contatoEmergenciaNome: props.contatoEmergenciaNome ?? "",
      contatoEmergenciaTel: props.contatoEmergenciaTel ?? "",
      contatoEmergenciaParentesco: props.contatoEmergenciaParentesco ?? "",
    })
    setEditing(false)
  }

  return (
    <Card className={!temDados && !editing ? "border-dashed" : undefined}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Heart className="size-4 text-danger-600" />
          Ficha Médica
        </CardTitle>
        {!editing ? (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="size-3.5" /> {temDados ? "Editar" : "Preencher"}
          </Button>
        ) : (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={pending}>
              <X className="size-3.5" />
            </Button>
            <Button size="sm" onClick={handleSave} disabled={pending}>
              <Check className="size-3.5" /> Salvar
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo Sanguíneo</Label>
                <Select value={form.tipoSanguineo || undefined} onValueChange={(v) => setForm({ ...form, tipoSanguineo: v ?? "" })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_SANGUINEOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Parentesco (emergência)</Label>
                <Select
                  value={form.contatoEmergenciaParentesco || undefined}
                  onValueChange={(v) => setForm({ ...form, contatoEmergenciaParentesco: v ?? "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {PARENTESCOS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nome contato de emergência</Label>
                <Input
                  value={form.contatoEmergenciaNome}
                  onChange={(e) => setForm({ ...form, contatoEmergenciaNome: e.target.value })}
                  placeholder="Nome completo"
                  disabled={pending}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Telefone de emergência</Label>
                <Input
                  value={form.contatoEmergenciaTel}
                  onChange={(e) => setForm({ ...form, contatoEmergenciaTel: e.target.value })}
                  placeholder="(11) 99999-9999"
                  disabled={pending}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Alergias</Label>
              <Textarea
                value={form.alergias}
                onChange={(e) => setForm({ ...form, alergias: e.target.value })}
                placeholder="Ex: alergia a dipirona, amendoim..."
                rows={2}
                disabled={pending}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Condições de saúde / observações médicas</Label>
              <Textarea
                value={form.condicaoSaude}
                onChange={(e) => setForm({ ...form, condicaoSaude: e.target.value })}
                placeholder="Ex: asma, diabetes, usa medicação contínua..."
                rows={2}
                disabled={pending}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            {!temDados ? (
              <p className="text-center text-muted-foreground py-4 text-xs">
                Nenhuma informação médica cadastrada. Clique em Preencher.
              </p>
            ) : (
              <>
                {props.tipoSanguineo && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-danger-50 px-2.5 py-1 text-xs font-bold text-danger-600">
                      {props.tipoSanguineo}
                    </span>
                    <span className="text-muted-foreground text-xs">Tipo sanguíneo</span>
                  </div>
                )}

                {(props.contatoEmergenciaNome || props.contatoEmergenciaTel) && (
                  <div className="rounded-lg border border-border bg-muted/40 p-3">
                    <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      <Phone className="size-3" />
                      Contato de Emergência
                    </div>
                    <p className="font-medium">
                      {props.contatoEmergenciaNome}
                      {props.contatoEmergenciaParentesco && (
                        <span className="ml-1.5 text-xs text-muted-foreground">({props.contatoEmergenciaParentesco})</span>
                      )}
                    </p>
                    {props.contatoEmergenciaTel && (
                      <a
                        href={`tel:${props.contatoEmergenciaTel}`}
                        className="text-xs text-brand-600 hover:underline"
                      >
                        {props.contatoEmergenciaTel}
                      </a>
                    )}
                  </div>
                )}

                {props.alergias && (
                  <div className="rounded-lg border border-warning-200 bg-warning-50 p-3">
                    <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-warning-600 uppercase tracking-wide">
                      <AlertTriangle className="size-3" />
                      Alergias
                    </div>
                    <p className="text-xs text-warning-900">{props.alergias}</p>
                  </div>
                )}

                {props.condicaoSaude && (
                  <div className="rounded-lg border border-border bg-muted/40 p-3">
                    <div className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Condições de Saúde
                    </div>
                    <p className="text-xs text-foreground">{props.condicaoSaude}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
