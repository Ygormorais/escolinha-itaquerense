# Design Spec — Melhorias v2 E.C. Itaquerense

**Date:** 2026-05-22
**Scope:** Dashboard charts, geração de mensalidades, detalhe do aluno, melhorias visuais

---

## 1. Gráficos no Dashboard

**Componente:** `components/dashboard/chart-receita-custos.tsx` (`"use client"`)

**Props:**
```ts
type ChartData = { mes: string; recebido: number; custos: number }
interface Props { data: ChartData[] }
```

**Lógica no servidor (`app/page.tsx`):**
- Buscar pagamentos com `dataPagamento != null` dos últimos 6 meses
- Buscar custos dos últimos 6 meses
- Agrupar por `YYYY-MM`, somar `valorRecebido` e `valor`
- Passar como prop para o componente client

**Componente:**
- `BarChart` do Recharts com `ResponsiveContainer width="100%" height={240}`
- Barra vermelha (`#C62828`) para recebido, cinza (`#94A3B8`) para custos
- `XAxis` com mês formatado (ex: "Jan/25"), `YAxis` com `tickFormatter` em R$
- `Tooltip` formatado em pt-BR
- `Legend` mostrando "Recebido" e "Custos"
- Wrapper `Card` com `CardHeader` "Receita vs Custos — Últimos 6 meses"

**Posição:** Abaixo do grid de StatCards, largura total.

---

## 2. Geração de Mensalidades

**Server Action:** `app/actions/pagamentos.ts` — função `gerarMensalidadesMes(mes: string)`

**Lógica:**
1. Buscar todos os alunos com `status: "Ativo"`
2. Para cada aluno, verificar se já existe `Pagamento` com `mesReferencia === mes`
3. Criar apenas os que não existem, com `dataVencimento` no dia 10 do mês
4. Retornar `{ criados: number, ignorados: number }`
5. `revalidatePath("/pagamentos")` e `revalidatePath("/")`

**UI (`app/pagamentos/pagamentos-client.tsx`):**
- Botão "Gerar Mensalidades" no header da página ao lado do filtro de mês
- Ao clicar: abre `AlertDialog` confirmando "Gerar mensalidades de [mês] para todos os alunos ativos?"
- Após confirmação: chama action, exibe toast com resultado ("X mensalidades criadas, Y já existiam")
- Usar shadcn `AlertDialog` (instalar se não existir) ou `Dialog` com botões Cancelar/Confirmar

---

## 3. Página de Detalhe do Aluno

**Rota:** `app/alunos/[id]/page.tsx` (server component)

**Dados buscados:**
```ts
db.aluno.findUnique({
  where: { id },
  include: {
    pagamentos: { orderBy: { dataVencimento: "desc" } },
    frequencias: { orderBy: { data: "desc" }, take: 30 },
  },
})
```

**Layout:**
```
← Voltar para Alunos

[Nome do Aluno]                    [Badge status]
Turma: Sub-11 | Horário: Seg/Qua  | Responsável: Nome | Tel: (11) 99999

[Card: Informações]          [Card: Financeiro]
Nome, nascimento, email,     Mensalidade, data matrícula,
responsável, telefone        total pago, total pendente

[Card: Histórico de Pagamentos — largura total]
Tabela: Mês Ref | Vencimento | Valor | Pago em | Forma | Status

[Card: Histórico de Frequência — largura total]
Tabela: Data | Presença (badge colorido)
```

**Status dos pagamentos:** calculado via `calcStatus(dataVencimento, dataPagamento)` de `lib/utils.ts`.

**Link na lista:** Em `alunos-client.tsx`, o nome do aluno vira `<Link href={/alunos/${id}}>` com estilo `hover:underline text-brand-800`.

---

## 4. Melhorias Visuais

**`app/inadimplencia/page.tsx`:**
- Telefone: trocar link `<a href="tel:...">Ligar</a>` por botão com ícone `Phone` do lucide visível
- Badge de nível: adicionar ícone `AlertTriangle` ao lado do texto

**`app/caixa/page.tsx`:**
- `MonthPicker` movido para inline com o `PageHeader` usando prop `action` do PageHeader
- Remover o bloco separado do month-picker, ficando mais limpo

**`app/recibos/page.tsx`:**
- Wrapper do preview: `w-full max-w-[680px] overflow-x-auto` para não vazar em mobile
- Formulário: adicionar `gap-y-5` para mais respiração entre campos

---

## Arquivos Afetados

| Arquivo | Ação |
|---------|------|
| `components/dashboard/chart-receita-custos.tsx` | Criar |
| `app/page.tsx` | Modificar (adicionar chart data + componente) |
| `app/actions/pagamentos.ts` | Modificar (adicionar `gerarMensalidadesMes`) |
| `app/pagamentos/pagamentos-client.tsx` | Modificar (botão + dialog confirmação) |
| `app/alunos/[id]/page.tsx` | Criar |
| `app/alunos/alunos-client.tsx` | Modificar (nome → link) |
| `app/inadimplencia/page.tsx` | Modificar (melhorias visuais) |
| `app/caixa/page.tsx` | Modificar (month-picker inline) |
| `app/recibos/page.tsx` | Modificar (overflow + spacing) |
