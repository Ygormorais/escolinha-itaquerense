# Spec: Cron de Geração Mensal e Importação de Extrato OFX

Data: 2026-06-15

## Contexto

Dois subsistemas independentes de automação financeira:

1. **Geração mensal automática** — o admin hoje precisa clicar em "Gerar Mês" manualmente no dia 1. O cron diário já existe; basta chamar a lógica de geração quando `dia === 1`.

2. **Importação de extrato OFX** — permite marcar mensalidades como pagas em lote fazendo upload de um arquivo OFX exportado do banco, sem precisar registrar cada pagamento manualmente.

---

## Feature 1 — Cron de Geração Mensal Automática

### Problema

`gerarMensalidadesMes` em `app/actions/pagamentos.ts` tem `requireAuth()` embutido. O cron não pode chamá-la diretamente.

### Solução

Extrair a lógica pura para `lib/pagamentos-jobs.ts`:

```ts
export async function runGerarMensalidadesMes(
  mes: string
): Promise<{ criados: number; ignorados: number }> {
  const [ano, mesNum] = mes.split("-").map(Number)
  const rawDia = getConfig().diaVencimento
  const diaVencimento = Number.isInteger(rawDia) && rawDia >= 1 && rawDia <= 28 ? rawDia : 10

  const [alunos, existentes] = await Promise.all([
    db.aluno.findMany({ where: { status: "Ativo" } }),
    db.pagamento.findMany({ where: { mesReferencia: mes }, select: { alunoId: true } }),
  ])

  const existentesSet = new Set(existentes.map((e) => e.alunoId))
  const novos = alunos.filter((a) => !existentesSet.has(a.id))

  if (novos.length > 0) {
    await db.pagamento.createMany({
      data: novos.map((a) => ({
        alunoId: a.id,
        mesReferencia: mes,
        dataVencimento: new Date(ano, mesNum - 1, diaVencimento),
      })),
    })
  }

  return { criados: novos.length, ignorados: existentesSet.size }
}
```

O server action `gerarMensalidadesMes` passa a delegar para essa função (mantém `requireAuth()` e os `revalidatePath` — `runGerarMensalidadesMes` não chama revalidatePath, deixa isso para o chamador).

### Modificação no cron

Em `app/api/cron/lembretes/route.ts`, dentro do `GET`:

```ts
const now = new Date()
const geracaoMensal =
  now.getDate() === 1
    ? await runGerarMensalidadesMes(format(now, "yyyy-MM"))
    : null
```

Incluir `geracaoMensal` no JSON de resposta.

### Arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `lib/pagamentos-jobs.ts` |
| Modificar | `app/actions/pagamentos.ts` (delegar para `runGerarMensalidadesMes`) |
| Modificar | `app/api/cron/lembretes/route.ts` (chamar no dia 1) |

### Testes

`lib/__tests__/pagamentos-jobs.test.ts` — novo describe `runGerarMensalidadesMes`:
- Cria mensalidades para alunos ativos no mês
- Ignora alunos que já têm mensalidade no mês (idempotente)
- Usa `diaVencimento` da config
- Retorna `{ criados, ignorados }` corretos

---

## Feature 2 — Importação de Extrato OFX

### Formato OFX (SGML)

Padrão exportado pelos bancos brasileiros (Bradesco, Itaú, Caixa, Inter, Sicoob). Cada transação é um bloco `<STMTTRN>`:

```
<STMTTRN>
<TRNTYPE>CREDIT</TRNTYPE>
<DTPOSTED>20250601120000</DTPOSTED>
<TRNAMT>150.00</TRNAMT>
<FITID>12345678</FITID>
<MEMO>PIX RECEBIDO - MARIA SILVA</MEMO>
</STMTTRN>
```

Campos relevantes: `TRNAMT` (valor), `DTPOSTED` (data), `MEMO` (descrição), `FITID` (ID único), `TRNTYPE` (tipo).

Filtro: apenas `TRNAMT > 0` (créditos).

### `lib/ofx-parser.ts`

```ts
export type OFXTransaction = {
  fitid: string
  date: Date
  amount: number
  memo: string
}

export function parseOFX(content: string): OFXTransaction[]
```

Implementação:
- Extrai todos os blocos `<STMTTRN>...</STMTTRN>` via regex
- Para cada bloco, extrai campos com `extractTag(block, 'TAG')`
- Parseia data: `YYYYMMDDHHMMSS` → `new Date(y, m-1, d)`
- Filtra `amount > 0`
- Lança `Error("Nenhuma transação encontrada no arquivo OFX")` se resultado vazio

### `lib/ofx-matcher.ts`

```ts
type MatchConfianca = "alta" | "baixa" | "nenhuma"

export type MatchResult = {
  fitid: string
  date: Date
  amount: number
  memo: string
  alunoId: number | null
  alunoNome: string | null
  pagamentoId: number | null
  mesReferencia: string | null
  confianca: MatchConfianca
}

export function matchTransactions(
  transactions: OFXTransaction[],
  alunos: { id: number; nome: string }[],
  pagamentos: { id: number; alunoId: number; mesReferencia: string; dataPagamento: Date | null }[]
): MatchResult[]
```

Algoritmo de matching:
1. Normaliza nomes: `toLowerCase()` + `normalize('NFD')` + remove diacríticos + remove non-alphanumeric
2. Para cada transação, tenta casar com aluno: verifica se `primeiraPalavra` E `últimaPalavra` do nome normalizado aparecem no `memo` normalizado (palavras com ≥ 3 chars)
3. Se match encontrado: busca a mensalidade mais antiga com `dataPagamento === null` para esse aluno
4. Confiança:
   - `"alta"`: match de nome encontrado e há exatamente 1 mensalidade pendente
   - `"baixa"`: match de nome encontrado mas há 0 ou múltiplas mensalidades pendentes
   - `"nenhuma"`: sem match de nome

### `app/actions/importar-extrato.ts`

**`previewOFX(content: string)`**

```ts
export async function previewOFX(
  content: string
): Promise<MatchResult[] | { error: string }>
```

- Chama `requireAuth()`
- Chama `parseOFX(content)` — retorna `{ error }` em caso de exceção
- Busca todos os alunos ativos e pagamentos sem `dataPagamento`
- Chama `matchTransactions(...)` e retorna o array

**`confirmarImportacaoOFX(selecoes)`**

```ts
export async function confirmarImportacaoOFX(
  selecoes: { pagamentoId: number; valor: number; dataPagamento: string }[]
): Promise<{ atualizados: number } | { error: string }>
```

- Chama `requireAuth()`
- Para cada seleção: `db.pagamento.update({ where: { id }, data: { dataPagamento, valorRecebido: valor, formaPagamento: "Importação OFX" } })`
- Chama `revalidatePath("/pagamentos")`, `revalidatePath("/inadimplencia")`, `revalidatePath("/caixa")`
- Retorna `{ atualizados: selecoes.length }`

### Página e Client Component

**`app/pagamentos/importar/page.tsx`** — server component, `requireAuth()`, renderiza `<ImportarExtratoClient />`. Link de volta: `← Pagamentos`.

**`components/pagamentos/importar-extrato-client.tsx`** — client component com três fases:

**Fase 1 — Upload:**
- `<input type="file" accept=".ofx,.ofc">` lê o arquivo via `FileReader.readAsText(file, "latin1")` (encoding padrão dos bancos BR)
- Botão "Analisar" chama `previewOFX(content)` via `useTransition`
- Spinner enquanto processa

**Fase 2 — Preview:**
- Tabela com colunas: Data | Descrição | Valor | Aluno | Mês | Incluir
- Linhas com `confianca === "alta"`: checkbox marcado por padrão, fundo neutro
- Linhas com `confianca === "baixa"`: checkbox desmarcado, aviso "verificar"
- Linhas com `confianca === "nenhuma"`: checkbox desmarcado e desabilitado, texto "não identificado"
- Botão "Confirmar N pagamentos" (conta apenas checkboxes marcados)
- Botão "Voltar" para retornar à fase 1

**Fase 3 — Resultado:**
- `toast.success("X pagamentos registrados")`
- Retorna à fase 1 (limpa estado)

### Link de acesso

Em `app/pagamentos/pagamentos-client.tsx`, adicionar botão "Importar OFX" no header da página ao lado dos filtros existentes, linkando para `/pagamentos/importar`.

### Arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `lib/ofx-parser.ts` |
| Criar | `lib/ofx-matcher.ts` |
| Criar | `app/actions/importar-extrato.ts` |
| Criar | `app/pagamentos/importar/page.tsx` |
| Criar | `components/pagamentos/importar-extrato-client.tsx` |
| Modificar | `app/pagamentos/pagamentos-client.tsx` (botão Importar OFX) |

### Testes

**`lib/__tests__/ofx-parser.test.ts`:**
- Parseia OFX SGML com 3 transações, retorna só créditos
- Lança erro em arquivo sem blocos STMTTRN
- Parseia data no formato YYYYMMDDHHMMSS
- Parseia data no formato YYYYMMDD

**`lib/__tests__/ofx-matcher.test.ts`:**
- Transação com MEMO "PIX - JOAO SILVA" casa com aluno "João Silva" → confiança alta
- Transação com MEMO sem nome → confiança nenhuma
- Aluno com múltiplas mensalidades pendentes → confiança baixa
- Aluno sem mensalidades pendentes → confiança baixa (match mas sem pagamento)
- Normalização de acentos: "JOAO" casa com "João"

---

## Ordem de implementação

**Feature 1:**
1. Criar `runGerarMensalidadesMes` em `lib/pagamentos-jobs.ts` + testes unitários
2. Atualizar `gerarMensalidadesMes` em `app/actions/pagamentos.ts` para delegar
3. Atualizar cron `app/api/cron/lembretes/route.ts`

**Feature 2:**
4. `lib/ofx-parser.ts` + testes unitários
5. `lib/ofx-matcher.ts` + testes unitários
6. `app/actions/importar-extrato.ts`
7. `app/pagamentos/importar/page.tsx` + `components/pagamentos/importar-extrato-client.tsx`
8. Botão "Importar OFX" em `pagamentos-client.tsx`
