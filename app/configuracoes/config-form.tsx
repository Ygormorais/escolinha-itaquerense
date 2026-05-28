"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { updateClubConfig } from "@/app/actions/config"
import type { ClubConfig } from "@/lib/config"
import { toast } from "sonner"

export function ConfigForm({ config }: { config: ClubConfig }) {
  const [form, setForm] = useState(config)
  const [saving, setSaving] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateClubConfig(form)
      toast.success("Configurações salvas")
    } catch {
      toast.error("Erro ao salvar configurações")
    } finally {
      setSaving(false)
    }
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
              <label className="text-sm font-medium">Nome do Clube</label>
              <Input name="nome" value={form.nome} onChange={handleChange} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Endereço</label>
              <Input name="endereco" value={form.endereco} onChange={handleChange} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Cidade/UF</label>
              <Input name="cidade" value={form.cidade} onChange={handleChange} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Telefone</label>
              <Input name="telefone" value={form.telefone} onChange={handleChange} placeholder="(11) 99999-9999" />
            </div>

            <div className="border-t pt-4 space-y-4">
              <p className="text-sm font-semibold text-foreground">PIX</p>
              <div className="space-y-1">
                <label className="text-sm font-medium">Chave PIX</label>
                <Input
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
                <label className="text-sm font-medium">Número da Escolinha</label>
                <Input
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
                  <label className="text-sm font-medium">Meta mensal (R$)</label>
                  <Input
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
                  <label className="text-sm font-medium">Capacidade por turma</label>
                  <Input
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
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <p className="text-sm font-semibold text-foreground">Google Calendar</p>
              <div className="space-y-1">
                <label className="text-sm font-medium">ID do Google Calendar</label>
                <Input
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
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
