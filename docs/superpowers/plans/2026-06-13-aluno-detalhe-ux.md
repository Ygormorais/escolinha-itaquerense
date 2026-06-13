# Varredura UX — /alunos/[id] — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir a11y, feedback de ação e consistência visual em 4 sub-componentes da página de detalhe do aluno.

**Architecture:** Fixes pontuais em 4 commits independentes (um por arquivo). Sem mudança de lógica de negócio. Só apresentação, acessibilidade e estados de carregamento.

**Tech Stack:** Next.js 15 App Router, React useTransition, shadcn/ui (Button, ConfirmDialog), Tailwind CSS v4, Playwright E2E

---

## Task 1: pagamento-button.tsx — a11y e Loader2

**Files:**
- Modify: `app/alunos/[id]/pagamento-button.tsx`

- [ ] **Step 1: Adicionar Loader2 ao import de lucide-react**

Linha atual: `import { CheckCircle } from "lucide-react"`  
Substituir por:
```tsx
import { CheckCircle, Loader2 } from "lucide-react"
```

- [ ] **Step 2: Adicionar htmlFor/id nos 3 campos do Dialog**

Localizar o `<div className="space-y-4 py-2">` com os 3 campos e substituir pelo bloco completo:
```tsx
<div className="space-y-4 py-2">
  <div>
    <label htmlFor="pag-data" className="text-sm font-medium">Data do pagamento</label>
    <Input id="pag-data" type="date" value={data} onChange={(e) => setData(e.target.value)} className="mt-1" />
  </div>
  <div>
    <label htmlFor="pag-forma" className="text-sm font-medium">Forma de pagamento</label>
    <Select value={forma} onValueChange={(v) => { if (v) setForma(v) }}>
      <SelectTrigger id="pag-forma" className="mt-1">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {FORMAS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
      </SelectContent>
    </Select>
  </div>
  <div>
    <label htmlFor="pag-valor" className="text-sm font-medium">Valor recebido (R$)</label>
    <Input
      id="pag-valor"
      type="number"
      step="0.01"
      value={valor}
      onChange={(e) => setValor(e.target.value)}
      className="mt-1"
    />
  </div>
</div>
```

- [ ] **Step 3: Adicionar Loader2 ao botão Confirmar**

Localizar o botão confirmar dentro de `<DialogFooter showCloseButton>` e substituir:
```tsx
<Button
  onClick={handleSalvar}
  disabled={pending}
  className="bg-brand-800 text-white hover:bg-brand-900"
>
  {pending ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : "Confirmar"}
</Button>
```

- [ ] **Step 4: Verificar tsc**

```bash
npx tsc --noEmit
```
Esperado: zero erros.

- [ ] **Step 5: Commit**

```bash
git add app/alunos/\[id\]/pagamento-button.tsx
git commit -m "fix(ux): aluno-detalhe — pagamento-button — htmlFor/id e Loader2"
```

---

## Task 2: foto-upload.tsx — useTransition, Button, ConfirmDialog e aria-label

**Files:**
- Modify: `app/alunos/[id]/foto-upload.tsx`

- [ ] **Step 1: Atualizar imports**

Substituir os imports atuais pelo bloco completo:
```tsx
"use client"

import { useRef, useState, useTransition } from "react"
import { Camera, Loader2, Trash2 } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
```

- [ ] **Step 2: Migrar uploading de useState para useTransition**

Substituir:
```tsx
const [uploading, setUploading] = useState(false)
```
Por:
```tsx
const [uploading, startUploading] = useTransition()
```

- [ ] **Step 3: Reescrever handleFile para usar startUploading**

Substituir a função `handleFile` inteira:
```tsx
function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0]
  if (!file) return

  if (inputRef.current) inputRef.current.value = ""

  const formData = new FormData()
  formData.append("foto", file)
  formData.append("alunoId", String(alunoId))

  startUploading(async () => {
    try {
      const res = await fetch("/api/upload/foto", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setPreview(data.url + "?t=" + Date.now())
      toast.success("Foto atualizada")
      router.refresh()
    } catch {
      toast.error("Erro ao enviar foto")
    }
  })
}
```

- [ ] **Step 4: Adicionar aria-label no label da câmera**

Localizar:
```tsx
<label className="absolute -bottom-2 -right-2 flex size-8 cursor-pointer items-center justify-center rounded-full border border-border bg-card shadow-sm hover:bg-muted transition-colors">
```
Adicionar `aria-label`:
```tsx
<label
  aria-label="Alterar foto do aluno"
  className="absolute -bottom-2 -right-2 flex size-8 cursor-pointer items-center justify-center rounded-full border border-border bg-card shadow-sm hover:bg-muted transition-colors"
>
```

- [ ] **Step 5: Substituir button raw "Remover" por Button + ConfirmDialog**

Localizar o bloco do `{preview && ( <button ...> )}` e substituir por:
```tsx
{preview && (
  <ConfirmDialog
    title="Remover foto?"
    description="A foto do aluno será excluída permanentemente."
    confirmLabel="Remover"
    variant="danger"
    onConfirm={handleRemover}
  >
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={removing}
      className="h-auto gap-1 p-0 text-xs text-danger-600 hover:text-danger-700 hover:bg-transparent"
    >
      <Trash2 className="size-3" />
      Remover
    </Button>
  </ConfirmDialog>
)}
```

- [ ] **Step 6: Verificar tsc**

```bash
npx tsc --noEmit
```
Esperado: zero erros.

- [ ] **Step 7: Commit**

```bash
git add app/alunos/\[id\]/foto-upload.tsx
git commit -m "fix(ux): aluno-detalhe — foto-upload — useTransition, ConfirmDialog e aria-label"
```

---

## Task 3: frequencia-chart.tsx — loading skeleton e empty state

**Files:**
- Modify: `app/alunos/[id]/frequencia-chart.tsx`

- [ ] **Step 1: Reescrever o componente com loading state e empty state**

Substituir o conteúdo completo do arquivo:
```tsx
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts"
import { getFrequenciaAluno } from "@/app/actions/frequencia"

type Ponto = { label: string; total: number; presentes: number; pct: number | null }

export function FrequenciaChart({ alunoId }: { alunoId: number }) {
  const [data, setData] = useState<Ponto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFrequenciaAluno(alunoId).then((d) => {
      setData(d)
      setLoading(false)
    })
  }, [alunoId])

  if (loading) return (
    <Card>
      <CardHeader>
        <CardTitle>Presença — últimos 6 meses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[180px] animate-pulse rounded-lg bg-muted" />
      </CardContent>
    </Card>
  )

  const temDados = data.some((d) => d.total > 0)

  if (!temDados) return (
    <Card>
      <CardHeader>
        <CardTitle>Presença — últimos 6 meses</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nenhum registro de frequência para este aluno ainda.
        </p>
      </CardContent>
    </Card>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Presença — últimos 6 meses</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EFE6E6" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              formatter={(v: unknown) => (typeof v === "number" ? `${v}%` : "Sem dados")}
              labelFormatter={(l) => `Mês: ${l}`}
            />
            <Bar dataKey="pct" name="% Presença" radius={[4, 4, 0, 0]}>
              {data.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={
                    entry.pct === null ? "#E8DEDA"
                    : entry.pct >= 75 ? "#0F7A5A"
                    : entry.pct >= 50 ? "#A86417"
                    : "#B3261E"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Verificar tsc**

```bash
npx tsc --noEmit
```
Esperado: zero erros.

- [ ] **Step 3: Commit**

```bash
git add app/alunos/\[id\]/frequencia-chart.tsx
git commit -m "fix(ux): aluno-detalhe — frequencia-chart — skeleton e empty state"
```

---

## Task 4: page.tsx — Button asChild nos links de ação

**Files:**
- Modify: `app/alunos/[id]/page.tsx`

- [ ] **Step 1: Verificar se Button já está importado**

Ler as primeiras linhas de `app/alunos/[id]/page.tsx` e confirmar se `Button` já aparece nos imports. Se não aparecer, adicionar ao import existente de `@/components/ui/button`:
```tsx
import { Button } from "@/components/ui/button"
```

Nota: `Link` já está importado de `"next/link"`.

- [ ] **Step 2: Substituir o link "Carteirinha"**

Localizar:
```tsx
<Link
  href={`/alunos/${aluno.id}/carteirinha`}
  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
>
  <IdCard className="size-4" />
  Carteirinha
</Link>
```
Substituir por:
```tsx
<Button variant="outline" size="sm" asChild>
  <Link href={`/alunos/${aluno.id}/carteirinha`}>
    <IdCard className="size-4" />
    Carteirinha
  </Link>
</Button>
```

- [ ] **Step 3: Substituir o link "Declaração anual"**

Localizar:
```tsx
<Link
  href={`/recibos/declaracao?alunoId=${aluno.id}&ano=${new Date().getFullYear()}`}
  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
>
  <FileText className="size-4" />
  Declaração anual
</Link>
```
Substituir por:
```tsx
<Button variant="outline" size="sm" asChild>
  <Link href={`/recibos/declaracao?alunoId=${aluno.id}&ano=${new Date().getFullYear()}`}>
    <FileText className="size-4" />
    Declaração anual
  </Link>
</Button>
```

- [ ] **Step 4: Verificar tsc**

```bash
npx tsc --noEmit
```
Esperado: zero erros.

- [ ] **Step 5: Commit**

```bash
git add app/alunos/\[id\]/page.tsx
git commit -m "fix(ux): aluno-detalhe — page — Button asChild nos links Carteirinha e Declaracao"
```

---

## Task 5: Verificação final

**Files:** nenhum

- [ ] **Step 1: Rodar unit tests**

```bash
npm test
```
Esperado: 402 tests passed (ou mais — sem regressões).

- [ ] **Step 2: Rodar E2E de alunos**

```bash
npx playwright test e2e/alunos.spec.ts --reporter=line
```
Esperado: todos os testes passam.

- [ ] **Step 3: Verificar tsc final**

```bash
npx tsc --noEmit
```
Esperado: zero erros.
