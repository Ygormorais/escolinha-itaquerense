# Geração Automática de Mensalidades na Aprovação — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ao aprovar uma pré-matrícula, gerar N meses de pagamentos automaticamente (1/3/6/12, configurável na hora).

**Architecture:** Estende `aprovarPreMatricula` para aceitar `meses: number` e criar os pagamentos dentro da mesma transação. `AprovarDialog` ganha Select de meses. Toast informa quantas mensalidades foram geradas e o período.

**Tech Stack:** Next.js 16, Prisma SQLite, `date-fns`, Vitest.

**Working directory:** `escolinha-itaquerense/`

---

## Mapa de arquivos

| Arquivo | Ação |
|---|---|
| `app/actions/matricula.ts` | Modify — `aprovarPreMatricula` aceita `meses` e cria pagamentos |
| `app/actions/__tests__/matricula.test.ts` | Modify — novos casos de teste |
| `app/configuracoes/matriculas/matriculas-client.tsx` | Modify — `AprovarDialog` + `handleAprovar` |

---

## Task 1: Estender `aprovarPreMatricula` (TDD)

**Files:**
- Modify: `app/actions/matricula.ts`
- Modify: `app/actions/__tests__/matricula.test.ts`

- [ ] **Step 1: Adicionar novos casos de teste**

No arquivo `app/actions/__tests__/matricula.test.ts`, adicione dentro do bloco `describe("aprovarPreMatricula")`:

```ts
  it("gera N mensalidades quando meses > 0", async () => {
    const createSpy = vi.fn().mockResolvedValue({ id: 5 })
    ;(m as unknown as { pagamento: { create: ReturnType<typeof vi.fn> } }).pagamento = {
      create: createSpy,
      ...(m as unknown as any).pagamento,
    }

    await aprovarPreMatricula(1, { mensalidade: 200, meses: 3 })

    // Deve criar 3 pagamentos além do aluno
    expect(createSpy).toHaveBeenCalledTimes(3)
    const calls = createSpy.mock.calls.map((c: any) => c[0].data.mesReferencia)
    // Os 3 meses devem ser consecutivos a partir do mês atual
    expect(calls).toHaveLength(3)
  })

  it("nao gera mensalidades quando meses = 0", async () => {
    const createSpy = vi.fn().mockResolvedValue({ id: 5 })
    ;(m as unknown as any).pagamento.create = createSpy

    await aprovarPreMatricula(1, { mensalidade: 200, meses: 0 })
    expect(createSpy).not.toHaveBeenCalled()
  })
```

> Nota: o mock de `db` já expõe `db.$transaction` que invoca o callback com `db` como `tx`. Adicione `pagamento: { ..., create: vi.fn() }` no mock inicial se ainda não existir.

- [ ] **Step 2: Rodar — esperar falha**

Run: `npx vitest run app/actions/__tests__/matricula.test.ts`
Expected: FAIL nos novos testes.

- [ ] **Step 3: Implementar em `app/actions/matricula.ts`**

Adicione import no topo:

```ts
import { addMonths, format, setDate } from "date-fns"
```

Altere a assinatura de `aprovarPreMatricula`:

```ts
export async function aprovarPreMatricula(
  id: number,
  opts: { mensalidade: number; desconto?: number; meses?: number }
): Promise<AprovarResult> {
```

Dentro da transação, após o `tx.preMatricula.update(...)`, adicione:

```ts
    const qtdMeses = Math.max(0, Math.min(12, Number(opts.meses ?? 0)))
    for (let i = 0; i < qtdMeses; i++) {
      const dataRef = addMonths(new Date(), i)
      const vencimento = setDate(dataRef, 10)
      vencimento.setHours(0, 0, 0, 0)
      await tx.pagamento.create({
        data: {
          alunoId: novo.id,
          mesReferencia: format(dataRef, "yyyy-MM"),
          dataVencimento: vencimento,
        },
      })
    }
```

Altere o retorno para incluir `mesesGerados`:

```ts
  revalidatePath("/configuracoes/matriculas")
  revalidatePath("/pagamentos")
  return { success: true, alunoId: aluno.id }
```

- [ ] **Step 4: Rodar — esperar passar**

Run: `npx vitest run app/actions/__tests__/matricula.test.ts`
Expected: PASS (todos os testes, incluindo os novos).

- [ ] **Step 5: Commit**

```bash
git add app/actions/matricula.ts app/actions/__tests__/matricula.test.ts
git commit -m "feat(matricula): aprovarPreMatricula gera N mensalidades automaticas"
```

---

## Task 2: Atualizar `AprovarDialog` na UI

**Files:**
- Modify: `app/configuracoes/matriculas/matriculas-client.tsx`

- [ ] **Step 1: Adicionar estado `meses` ao `AprovarDialog`**

Localize `function AprovarDialog` no final do arquivo. Adicione o estado e o select:

```tsx
function AprovarDialog({
  nomeAluno,
  onConfirm,
}: {
  nomeAluno: string
  onConfirm: (mensalidade: number, desconto: number, meses: number) => void
}) {
  const [open, setOpen] = useState(false)
  const [mensalidade, setMensalidade] = useState("")
  const [desconto, setDesconto] = useState("")
  const [meses, setMeses] = useState("3")

  const valor = Number(mensalidade)
  const valido = mensalidade.trim() !== "" && Number.isFinite(valor) && valor >= 0

  function handleConfirm() {
    if (!valido) return
    const desc = Number(desconto)
    onConfirm(valor, Number.isFinite(desc) && desc > 0 ? desc : 0, Number(meses))
    setOpen(false)
    setMensalidade("")
    setDesconto("")
    setMeses("3")
  }
```

No JSX do `DialogContent`, após o campo Desconto, adicione:

```tsx
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Gerar mensalidades</span>
              <Select value={meses} onValueChange={setMeses}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Não gerar (manualmente depois)</SelectItem>
                  <SelectItem value="1">1 mês (só o atual)</SelectItem>
                  <SelectItem value="3">3 meses (recomendado)</SelectItem>
                  <SelectItem value="6">6 meses</SelectItem>
                  <SelectItem value="12">12 meses (ano letivo)</SelectItem>
                </SelectContent>
              </Select>
            </label>
```

- [ ] **Step 2: Atualizar `handleAprovar` para receber `meses`**

Localize `function handleAprovar` no componente `MatriculasClient`:

```tsx
  function handleAprovar(id: number, mensalidade: number, desconto: number, meses: number) {
    startTransition(async () => {
      const res = await aprovarPreMatricula(id, { mensalidade, desconto, meses })
      if ("error" in res) {
        toast.error((res as { error: string }).error)
        return
      }
      const msg = meses > 0
        ? `Aluno criado + ${meses} mensalidade${meses > 1 ? "s" : ""} gerada${meses > 1 ? "s" : ""}`
        : "Pré-matrícula aprovada — aluno criado"
      toast.success(msg)
    })
  }
```

Atualize a invocação do `AprovarDialog`:

```tsx
                      <AprovarDialog
                        nomeAluno={m.nomeAluno}
                        onConfirm={(mensalidade, desconto, meses) => handleAprovar(m.id, mensalidade, desconto, meses)}
                      />
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -i "matricula" | head -5`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add app/configuracoes/matriculas/matriculas-client.tsx
git commit -m "feat(matriculas): AprovarDialog com selector de meses para geracao automatica"
```

---

## Task 3: Verificação final

- [ ] **Step 1: Rodar todos os testes**

Run: `npx vitest run app/actions/__tests__/matricula.test.ts`
Expected: PASS.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -cE "error TS"`
Expected: `0`

- [ ] **Step 3: Push**

```bash
git push origin develop
```
