# Varredura UX — /alunos/[id] (Página de Detalhe do Aluno)

**Data:** 2026-06-13  
**Contexto:** Segunda rodada de polimento UX profundo — mesmos critérios da rodada anterior (a11y, feedback, consistência visual, loading states).

---

## Escopo

4 arquivos em `app/alunos/[id]/`:

| Arquivo | Problema |
|---------|----------|
| `pagamento-button.tsx` | Labels sem `htmlFor`/`id`; botão sem Loader2 |
| `foto-upload.tsx` | `uploading` como `useState<boolean>`; `<button>` raw sem Button/ConfirmDialog; label da câmera sem aria-label |
| `frequencia-chart.tsx` | Fetch via `useEffect` sem skeleton; `return null` sem mensagem contextual |
| `page.tsx` | Links "Carteirinha" e "Declaração anual" com classes inline replicando Button manualmente |

---

## Fixes por Arquivo

### 1. `pagamento-button.tsx` — a11y e Loader2

**A11y:** Adicionar `htmlFor`/`id` nos 3 campos do Dialog de pagamento:
- `htmlFor="pag-data"` no label "Data do pagamento" + `id="pag-data"` no Input
- `htmlFor="pag-forma"` no label "Forma de pagamento" + `id="pag-forma"` no SelectTrigger
- `htmlFor="pag-valor"` no label "Valor recebido (R$)" + `id="pag-valor"` no Input

**Spinner:** Botão "Confirmar" mostra `<Loader2 className="size-4 animate-spin" />` durante `pending`:
```tsx
{pending ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : "Confirmar"}
```

Adicionar `Loader2` ao import de lucide-react.

---

### 2. `foto-upload.tsx` — consistência e segurança

**Migrar `uploading` para `useTransition`:**
- Remover `const [uploading, setUploading] = useState(false)`
- Adicionar `const [uploading, startUploading] = useTransition()`
- Envolver o body de `handleFile` em `startUploading(async () => { ... })`
- Remover os `setUploading(true)` e `setUploading(false)` / `finally` block (useTransition gerencia o estado)

**Botão "Remover" → Button + ConfirmDialog:**
```tsx
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

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
```

**Aria-label no label da câmera:**
```tsx
<label
  aria-label="Alterar foto do aluno"
  className="absolute -bottom-2 -right-2 flex size-8 cursor-pointer items-center justify-center rounded-full border border-border bg-card shadow-sm hover:bg-muted transition-colors"
>
```

---

### 3. `frequencia-chart.tsx` — loading state e empty state

**Loading skeleton durante fetch:**
- Adicionar `const [loading, setLoading] = useState(true)` 
- No `useEffect`, definir `setLoading(false)` após `.then(setData)`
- Antes de verificar `temDados`, se `loading` retornar skeleton:
```tsx
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
```

**Empty state contextual** (em vez de `return null`):
```tsx
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
```

---

### 4. `page.tsx` — Button component nos links de ação

Substituir os dois `<Link>` com classes inline por `Button` + `asChild`:

```tsx
import { Button } from "@/components/ui/button"

<Button variant="outline" size="sm" asChild>
  <Link href={`/alunos/${aluno.id}/carteirinha`}>
    <IdCard className="size-4" />
    Carteirinha
  </Link>
</Button>

<Button variant="outline" size="sm" asChild>
  <Link href={`/recibos/declaracao?alunoId=${aluno.id}&ano=${new Date().getFullYear()}`}>
    <FileText className="size-4" />
    Declaração anual
  </Link>
</Button>
```

---

## Regras de Implementação

- **Um commit por arquivo** — mensagens: `fix(ux): aluno-detalhe — <arquivo> — <resumo>`
- **Zero mudança em lógica de negócio**
- **Verificação final:** `npx tsc --noEmit` + `npm test` + `npx playwright test e2e/alunos.spec.ts --reporter=line`
