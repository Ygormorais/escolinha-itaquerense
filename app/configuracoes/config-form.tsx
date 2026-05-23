"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { updateClubConfig } from "@/app/actions/config"
import type { ClubConfig } from "@/lib/config"
import { CheckCircle } from "lucide-react"

export function ConfigForm({ config }: { config: ClubConfig }) {
  const [form, setForm] = useState(config)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev: ClubConfig) => ({ ...prev, [e.target.name]: e.target.value }))
    setSaved(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateClubConfig(form)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="max-w-lg">
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
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saving} className="bg-brand-800 text-white hover:bg-brand-900">
              {saving ? "Salvando..." : "Salvar"}
            </Button>
            {saved && (
              <span className="flex items-center gap-1 text-sm text-success-600">
                <CheckCircle className="size-4" /> Salvo
              </span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
