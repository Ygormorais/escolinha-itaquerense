"use client"

import { useState, useTransition } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { updateClubConfig } from "@/app/actions/config"
import type { ClubConfig } from "@/lib/config"
import { toast } from "sonner"

export function ConfigForm({ config }: { config: ClubConfig }) {
  const [form, setForm] = useState(config)
  const [saving, startSaving] = useTransition()

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

            <Button type="submit" disabled={saving} className="bg-brand-800 text-white hover:bg-brand-900">
              {saving ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : "Salvar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
