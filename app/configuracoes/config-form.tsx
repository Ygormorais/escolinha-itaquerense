"use client"

import { useState, useTransition } from "react"
import { Loader2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { updateClubConfig } from "@/app/actions/config"
import type { ClubConfig } from "@/lib/config"
import { toast } from "sonner"

function interpolate(template: string, vars: Record<string, string>) {
  return Object.entries(vars).reduce((t, [k, v]) => t.replaceAll(`{${k}}`, v), template)
}

const PREVIEW_COBRANCA = {
  responsavel: "Maria",
  aluno: "João Silva",
  meses: "• 2026-04 — R$ 150,00\n• 2026-05 — R$ 150,00",
  total: "R$ 300,00",
  pix: "\nPIX: escolinha@exemplo.com",
}
const PREVIEW_VENCIMENTO = {
  responsavel: "Maria",
  aluno: "João Silva",
  data: "10/06/2026",
  valor: "R$ 150,00",
  pix: "\nPIX: escolinha@exemplo.com",
}
const PREVIEW_FALTA = {
  responsavel: "Maria",
  aluno: "João Silva",
  data: "20/06/2026",
}

function TemplatePreview({ template, vars }: { template: string; vars: Record<string, string> }) {
  const [show, setShow] = useState(false)
  if (!template.trim()) return null
  return (
    <div>
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="flex items-center gap-1 text-xs text-brand-700 hover:underline"
      >
        <Eye className="size-3" /> {show ? "Ocultar prévia" : "Ver prévia"}
      </button>
      {show && (
        <pre className="mt-2 whitespace-pre-wrap rounded-lg border bg-muted/50 p-3 text-xs leading-relaxed text-foreground font-sans">
          {interpolate(template, vars)}
        </pre>
      )}
    </div>
  )
}

export function ConfigForm({ config }: { config: ClubConfig }) {
  const [form, setForm] = useState(config)
  const [saving, startSaving] = useTransition()

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }))
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    startSaving(async () => {
      try {
        await updateClubConfig(form)
        toast.success("Configurações salvas")
      } catch {
        toast.error("Erro ao salvar configurações")
      }
    })
  }

  return (
    <div className="space-y-6 max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Dados do Clube</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="cfg-nome">Nome do Clube</Label>
              <Input id="cfg-nome" name="nome" value={form.nome} onChange={handleChange} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cfg-endereco">Endereço</Label>
              <Input id="cfg-endereco" name="endereco" value={form.endereco} onChange={handleChange} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cfg-cidade">Cidade/UF</Label>
              <Input id="cfg-cidade" name="cidade" value={form.cidade} onChange={handleChange} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cfg-telefone">Telefone</Label>
              <Input id="cfg-telefone" name="telefone" value={form.telefone} onChange={handleChange} placeholder="(11) 99999-9999" />
            </div>

            <div className="border-t pt-4 space-y-4">
              <p className="text-sm font-semibold text-foreground">PIX</p>
              <div className="space-y-1">
                <Label htmlFor="cfg-pix">Chave PIX</Label>
                <Input
                  id="cfg-pix"
                  name="chavePix"
                  value={form.chavePix ?? ""}
                  onChange={handleChange}
                  placeholder="email, CPF, CNPJ, telefone ou chave aleatória"
                />
                <p className="text-xs text-muted-foreground">Usada para gerar QR codes de cobrança</p>
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <p className="text-sm font-semibold text-foreground">WhatsApp</p>
              <div className="space-y-1">
                <Label htmlFor="cfg-whatsapp">Número da Escolinha</Label>
                <Input
                  id="cfg-whatsapp"
                  name="whatsapp"
                  value={form.whatsapp ?? ""}
                  onChange={handleChange}
                  placeholder="5511999999999"
                />
                <p className="text-xs text-muted-foreground">
                  Número usado no card &quot;Fale Conosco&quot; do portal do responsável
                </p>
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <p className="text-sm font-semibold text-foreground">Metas & Capacidade</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="cfg-meta">Meta mensal (R$)</Label>
                  <Input
                    id="cfg-meta"
                    type="number"
                    name="metaMensal"
                    value={form.metaMensal || ""}
                    onChange={handleChange}
                    placeholder="Ex: 5000"
                    min={0}
                    step={100}
                  />
                  <p className="text-xs text-muted-foreground">Receita alvo por mês</p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cfg-capacidade">Capacidade por turma</Label>
                  <Input
                    id="cfg-capacidade"
                    type="number"
                    name="capacidadeTurma"
                    value={form.capacidadeTurma || ""}
                    onChange={handleChange}
                    placeholder="Ex: 20"
                    min={1}
                    step={1}
                  />
                  <p className="text-xs text-muted-foreground">Máximo de alunos por turma</p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cfg-vencimento">Dia de vencimento</Label>
                  <Input
                    id="cfg-vencimento"
                    type="number"
                    name="diaVencimento"
                    value={form.diaVencimento || 10}
                    onChange={handleChange}
                    placeholder="10"
                    min={1}
                    max={28}
                    step={1}
                  />
                  <p className="text-xs text-muted-foreground">Dia do mês em que as mensalidades vencem (1–28)</p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cfg-intervalo-lembrete">Intervalo entre lembretes de inadimplência (dias)</Label>
                  <Input
                    id="cfg-intervalo-lembrete"
                    name="intervaloDiasLembreteInadimplencia"
                    type="number"
                    min={1}
                    max={90}
                    value={form.intervaloDiasLembreteInadimplencia}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <p className="text-sm font-semibold text-foreground">Google Calendar</p>
              <div className="space-y-1">
                <Label htmlFor="cfg-calendar">ID do Google Calendar</Label>
                <Input
                  id="cfg-calendar"
                  name="googleCalendarId"
                  value={form.googleCalendarId ?? ""}
                  onChange={handleChange}
                  placeholder="ex: escolinha.itaquerense@gmail.com"
                />
                <p className="text-xs text-muted-foreground">
                  ID do calendário (geralmente o email) usado no embed da agenda no portal do responsável.
                  Deixe vazio para desabilitar.
                </p>
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Templates WhatsApp</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Use <code className="bg-muted px-1 rounded text-[11px]">{"{responsavel}"}</code>, <code className="bg-muted px-1 rounded text-[11px]">{"{aluno}"}</code>, <code className="bg-muted px-1 rounded text-[11px]">{"{meses}"}</code>, <code className="bg-muted px-1 rounded text-[11px]">{"{total}"}</code>, <code className="bg-muted px-1 rounded text-[11px]">{"{pix}"}</code>, <code className="bg-muted px-1 rounded text-[11px]">{"{data}"}</code>, <code className="bg-muted px-1 rounded text-[11px]">{"{valor}"}</code>
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cfg-template-cobranca">Cobrança (inadimplência)</Label>
                <Textarea
                  id="cfg-template-cobranca"
                  name="templateCobranca"
                  value={form.templateCobranca ?? ""}
                  onChange={handleTextareaChange}
                  rows={5}
                  className="text-sm font-mono"
                  placeholder="Olá {responsavel}! ..."
                />
                <TemplatePreview template={form.templateCobranca ?? ""} vars={PREVIEW_COBRANCA} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cfg-template-vencimento">Lembrete de vencimento</Label>
                <Textarea
                  id="cfg-template-vencimento"
                  name="templateLembreteVencimento"
                  value={form.templateLembreteVencimento ?? ""}
                  onChange={handleTextareaChange}
                  rows={4}
                  className="text-sm font-mono"
                  placeholder="Olá {responsavel}! ..."
                />
                <TemplatePreview template={form.templateLembreteVencimento ?? ""} vars={PREVIEW_VENCIMENTO} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cfg-template-falta">Notificação de falta</Label>
                <Textarea
                  id="cfg-template-falta"
                  name="templateFalta"
                  value={form.templateFalta ?? ""}
                  onChange={handleTextareaChange}
                  rows={4}
                  className="text-sm font-mono"
                  placeholder="Olá {responsavel}! ..."
                />
                <TemplatePreview template={form.templateFalta ?? ""} vars={PREVIEW_FALTA} />
              </div>
            </div>

            <Button type="submit" disabled={saving} className="bg-brand-800 text-white hover:bg-brand-900">
              {saving ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : "Salvar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
