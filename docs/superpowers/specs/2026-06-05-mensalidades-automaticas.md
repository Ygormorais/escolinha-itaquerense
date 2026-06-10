# Geração Automática de Mensalidades na Aprovação — Spec

**Data:** 2026-06-05  
**Status:** Aprovado

## Objetivo
Ao aprovar uma pré-matrícula, gerar N meses de pagamentos automaticamente, com quantidade configurável pelo operador (1, 3, 6 ou 12 meses).

## Fluxo
1. Operador clica "Aprovar" em uma pré-matrícula pendente
2. `AprovarDialog` abre com campos: Mensalidade (R$), Desconto (R$), **Gerar mensalidades: [1 / 3 / 6 / 12]**
3. Operador confirma → action cria o aluno + N pagamentos mensais
4. Toast: "Aluno criado + 6 mensalidades geradas (Jun–Nov/2026)"

## Implementação

### `AprovarDialog` — novo campo
```tsx
<Select value={meses} onValueChange={setMeses}>
  <SelectItem value="1">1 mês (só o atual)</SelectItem>
  <SelectItem value="3">3 meses</SelectItem>
  <SelectItem value="6">6 meses</SelectItem>
  <SelectItem value="12">12 meses (ano letivo)</SelectItem>
</Select>
```
Default: `"3"`.

### `aprovarPreMatricula(id, { mensalidade, desconto, meses })`
Após criar o aluno, em loop:
```ts
for (let i = 0; i < meses; i++) {
  const dataRef = addMonths(new Date(), i)
  await tx.pagamento.create({
    data: {
      alunoId: aluno.id,
      mesReferencia: format(dataRef, "yyyy-MM"),
      dataVencimento: setDate(dataRef, 10), // dia 10 de cada mês
      // demais campos null (não pago ainda)
    }
  })
}
```

### Vencimento
Fixo no dia 10 de cada mês. Configurável futuramente via `Configuracao`.

## Impacto
- `app/actions/matricula.ts` — estende `aprovarPreMatricula`
- `app/configuracoes/matriculas/matriculas-client.tsx` — estende `AprovarDialog`
- `app/actions/__tests__/matricula.test.ts` — novos casos de teste

## Dados gerados
Pagamentos com `dataPagamento: null`, `valorRecebido: null` — aparecem normalmente em Inadimplência conforme vencem.
