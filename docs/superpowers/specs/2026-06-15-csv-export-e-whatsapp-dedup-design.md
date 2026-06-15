# Spec: Exportação CSV e WhatsApp Inadimplência com Dedup

Data: 2026-06-15

## Contexto

Duas melhorias independentes de operação diária:

1. **Exportação CSV** — botão em 5 páginas para baixar os dados em planilha, sem dependência de paginação ou estado visual
2. **WhatsApp inadimplência com dedup** — o job `runEnviarLembretesWhatsAppInadimplencia` já existe mas manda uma mensagem por mensalidade em atraso a cada execução do cron (aluno com 3 meses em atraso = 3 mensagens/dia). Precisa de dedup por aluno e intervalo configurável.

---

## Feature 1 — Exportação CSV

### Utilitário `lib/csv.ts`

```ts
export function toCsv(headers: string[], rows: (string | number | null)[][]): string
```

- Adiciona BOM UTF-8 (`﻿`) para Excel abrir com acentos corretos
- Escapa células com vírgula, aspas ou quebra de linha conforme RFC 4180
- Retorna string pronta para enviar como response

### Route handler `app/api/export/route.ts`

- Método: `GET`
- Auth: sessão admin via `requireAdmin()` — retorna 401 se não autenticado
- Parâmetros query:
  - `tipo`: `pagamentos | alunos | frequencia | inadimplencia | custos` (obrigatório)
  - `mes`: `YYYY-MM` (opcional — pagamentos, frequencia, custos)
  - `turma`: string (opcional — alunos, frequencia)
  - `status`: `Ativo | Inativo` (opcional — alunos)
- Headers de resposta: `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename=<tipo>-<YYYY-MM-DD>.csv`
- Tipo inválido → 400

**Colunas por entidade:**

| tipo | colunas |
|------|---------|
| pagamentos | Nome, Turma, Mês Ref., Valor (R$), Vencimento, Data Pagamento, Forma, Status |
| alunos | Nome, Nascimento, Turma, Responsável, Telefone, Email, Mensalidade (R$), Status |
| frequencia | Aluno, Turma, Data, Presença |
| inadimplencia | Aluno, Turma, Mês Ref., Valor (R$), Vencimento, Dias Atraso, Telefone |
| custos | Descrição, Valor (R$), Data, Categoria |

Filtros aplicados server-side via Prisma — exporta sempre o conjunto completo (sem paginação).

Valores monetários como número decimal (`150.00`), datas como `DD/MM/YYYY`.

### Componente `components/export-csv-button.tsx`

```tsx
<ExportCsvButton href="/api/export?tipo=pagamentos&mes=2025-06" filename="pagamentos-junho-2025.csv" />
```

- Client component
- Faz `fetch(href)` → `blob()` → cria `<a>` temporário com `URL.createObjectURL` e clica programaticamente
- Estado `isPending` via `useState` — botão mostra `Loader2` durante download
- Variant `outline`, ícone `Download` da lucide-react
- Em caso de erro (não-2xx): `toast.error("Erro ao exportar")`

### Integração nas páginas

Botão adicionado ao header de cada página, ao lado dos filtros existentes. Os filtros ativos da página são passados como query params:

| página | params repassados |
|--------|-------------------|
| `/pagamentos` | `mes` do filtro de mês ativo |
| `/alunos` | `status` e `turma` do filtro ativo |
| `/frequencia` | `turma` e `mes` do filtro ativo |
| `/inadimplencia` | nenhum (sempre tudo) |
| `/custos` | `mes` do filtro ativo |

O botão fica nos client components das páginas (onde os filtros já estão em estado React). O `filename` inclui o mês/filtro atual quando disponível (ex.: `pagamentos-2025-06.csv`).

### Testes

- `lib/__tests__/csv.test.ts`: toCsv com casos de células com vírgula, aspas, caracteres especiais, valor null
- `app/api/export/__tests__/route.test.ts`: 401 sem auth, 400 tipo inválido, 200 com CSV válido para cada `tipo` (mock do db)

---

## Feature 2 — WhatsApp inadimplência com dedup

### Config — novo campo

`lib/config.ts`: adicionar `intervaloDiasLembreteInadimplencia: number` (default: `7`) ao tipo `ClubConfig` e ao objeto `DEFAULT`.

`app/configuracoes/config-form.tsx`: campo numérico `intervaloDiasLembreteInadimplencia` na seção de configurações existente, label "Intervalo entre lembretes de inadimplência (dias)".

### `lib/whatsapp-jobs.ts` — reescrita de `runEnviarLembretesWhatsAppInadimplencia`

Fluxo:

1. Busca todos os pagamentos em atraso (`dataPagamento: null`, `dataVencimento < hoje`)
2. Agrupa por `alunoId` usando `Map<number, pagamento[]>`
3. Para cada aluno:
   a. Verifica se tem telefone — se não, incrementa `semTelefone`
   b. Busca último `WhatsAppMensagem` com `{ alunoId, origem: "lembrete-inadimplencia" }` ordenado por `createdAt desc`
   c. Se existe e `Date.now() - createdAt < intervaloDias * 86400000` → incrementa `pulados`, continua
   d. Constrói mensagem consolidada listando todos os meses em atraso em bullet points
   e. Envia via `getWhatsAppProvider().sendText()`
   f. Se sucesso: grava `WhatsAppMensagem` com `{ alunoId, telefone, mensagem, origem: "lembrete-inadimplencia", direcao: "outgoing", status: "sent", instancia: "escolinha" }`
   g. Se falha: incrementa `erros`
4. Retorna `{ enviados, pulados, erros, semTelefone }`

**Mensagem consolidada (exemplo — aluno com 2 meses em atraso):**

```
Olá Maria!

Lembrete: as seguintes mensalidades de *João Silva* estão em atraso:

• Abril/2025 — R$ 150,00
• Maio/2025 — R$ 150,00

Total: *R$ 300,00*
PIX: ygorcamisa1@gmail.com

Qualquer dúvida, entre em contato.
```

### Testes

- `lib/__tests__/whatsapp-jobs.test.ts`: mock do db e provider
  - aluno com 1 mês em atraso envia 1 mensagem
  - aluno com 3 meses em atraso envia 1 mensagem consolidada (não 3)
  - aluno já notificado há 3 dias (intervalo=7) é pulado
  - aluno notificado há 8 dias (intervalo=7) recebe nova mensagem
  - aluno sem telefone incrementa `semTelefone`

---

## Ordem de implementação

1. `lib/csv.ts` + testes unitários
2. `app/api/export/route.ts` + testes
3. `components/export-csv-button.tsx`
4. Integração do botão nas 5 páginas
5. Config: `intervaloDiasLembreteInadimplencia` em `lib/config.ts` + `config-form.tsx`
6. Reescrever `runEnviarLembretesWhatsAppInadimplencia` + testes
