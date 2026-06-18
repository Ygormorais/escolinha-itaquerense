# Frequência — Grupo B: Alerta de Queda + Notificação de Falta

**Data:** 2026-06-18
**Status:** Aprovado

## Contexto

Duas features sobre frequência. Boa parte da infraestrutura de relatório já existe (`getEstatisticasFrequencia`, `getResumoFrequenciaMes`, `getFrequenciaAluno`). Esta entrega adiciona: (1) um conceito formal de "aluno em queda" com alerta em dois lugares, e (2) notificação automática de falta via WhatsApp ao salvar a frequência.

---

## Feature 1 — Alerta de queda de frequência

### Regra de negócio

Um aluno está **em queda** quando, no mês de referência:
- presença % **< 70%**, E
- tem **pelo menos 4 registros** de frequência no mês (evita falso alarme com poucos dados)

### Lógica compartilhada (DRY)

Criar `lib/frequencia-alertas.ts`:

```ts
export type AlunoFrequencia = {
  id: number
  nome: string
  turma: string
  total: number
  presentes: number
  pct: number
}

export const LIMITE_QUEDA = 70
export const MIN_REGISTROS = 4

export function estaEmQueda(
  aluno: { pct: number; total: number },
  limite = LIMITE_QUEDA,
  minRegistros = MIN_REGISTROS
): boolean {
  return aluno.total >= minRegistros && aluno.pct < limite
}

export function filtrarEmQueda<T extends { pct: number; total: number }>(
  alunos: T[],
  limite = LIMITE_QUEDA,
  minRegistros = MIN_REGISTROS
): T[] {
  return alunos.filter((a) => estaEmQueda(a, limite, minRegistros))
}
```

Testes em `lib/__tests__/frequencia-alertas.test.ts`: abaixo do limite com registros suficientes (em queda), abaixo do limite com poucos registros (NÃO em queda), no limite exato 70% (NÃO em queda — usa `<`), acima do limite (NÃO).

### Server action — contagem para o dashboard

Adicionar em `app/actions/frequencia.ts`:

```ts
export async function getQtdeAlunosEmQueda(mes: string): Promise<number> {
  // reusa getEstatisticasFrequencia(mes).ranking (já calcula pct e total por aluno ativo)
  const { ranking } = await getEstatisticasFrequencia(mes)
  return filtrarEmQueda(ranking).length
}
```

> Nota: `getEstatisticasFrequencia` retorna `ranking` com `{ id, nome, turma, total, presentes, pct }` — compatível com `filtrarEmQueda`.

### Exibição 1 — Card no dashboard admin

Em `app/dashboard/page.tsx`:
- Chamar `getQtdeAlunosEmQueda(mesSelecionado)` junto das outras queries
- Adicionar um `StatCard` "Frequência em queda" com o valor, `variant="danger"` se > 0 / `"success"` se 0, ligado a `/frequencia`
- Seguir exatamente o padrão do StatCard "Inadimplentes" existente (mesmas props: title, value, variant, href/link)

### Exibição 2 — Destaque na tela de estatísticas

Em `app/frequencia/estatisticas-client.tsx`:
- **Reconciliar o filtro inline existente**: hoje há `const baixaFrequencia = ranking.filter((a) => a.pct < 75 && a.total >= 3)`. Substituir por `filtrarEmQueda(ranking)` de `lib/frequencia-alertas.ts` (passa a usar 70% / min 4, consistente com o dashboard)
- No topo do ranking: resumo "X alunos em alerta" quando houver
- Cada aluno em queda no ranking ganha um badge vermelho "Em queda" (usar `estaEmQueda(aluno)` para decidir)

---

## Feature 2 — Notificação de falta (síncrona ao salvar)

### Gatilho

Em `app/actions/frequencia.ts`, dentro de `salvarFrequencia`, **após** o `Promise.all` de upserts ter sucesso e antes do `revalidatePath`, disparar notificações para os alunos marcados **Ausente** ou **Justificado** naquele lote.

### Mensagem por tipo

- **Ausente:** `⚠️ Olá! Registramos a *falta* de *{nome}* no treino de hoje ({data}). Qualquer dúvida, estamos à disposição. — Escolinha Itaquerense`
- **Justificado:** `📋 Olá! Registramos a *ausência justificada* de *{nome}* no treino de hoje ({data}). — Escolinha Itaquerense`

### Dedup

Só notifica na **primeira** vez que aquele aluno fica Ausente/Justificado naquela **data**. Controle via `whatsAppMensagem` com `origem: "falta"`:

```ts
const jaNotificado = await db.whatsAppMensagem.findFirst({
  where: { alunoId, origem: "falta", createdAt: { gte: inicioDoDiaDeProcessamento } },
  select: { id: true },
})
```

> Como a frequência é sempre do dia em que se registra (data do treino), dedup por `alunoId + origem "falta" + createdAt >= início do dia atual` é suficiente e segue o padrão dos aniversariantes. Re-salvar a mesma turma não re-notifica.

### Não-bloqueante

A notificação roda em um helper separado e é envolvida em try/catch por aluno. Falha de WhatsApp **não** altera o retorno de `salvarFrequencia` (continua `{ success: true }`). Erros são contados/logados internamente.

### Helper

Criar em `lib/whatsapp-jobs.ts` (mesmo arquivo dos outros jobs, mesmo provider):

```ts
export async function notificarFaltas(
  registros: { alunoId: number; data: string; presenca: string }[]
): Promise<{ enviados: number; erros: number }>
```

- Filtra registros com presenca ∈ {"Ausente", "Justificado"}
- Para cada um: busca aluno (nome, telefone), valida telefone, aplica dedup, monta msg por tipo, envia via `getWhatsAppProvider().sendText`, registra em `whatsAppMensagem` com `origem: "falta"`
- `salvarFrequencia` chama `await notificarFaltas(registros).catch(() => {})` — best-effort

### Teste

- Unit do helper de mensagem (texto por tipo) se extraído como função pura `montarMensagemFalta(nome, data, presenca)`
- Não testar o envio real (provider é mockado nos testes; seguir padrão dos jobs existentes que não têm teste de envio)

---

## Testes

- **Unit (vitest):**
  - `lib/__tests__/frequencia-alertas.test.ts` — `estaEmQueda` / `filtrarEmQueda` (4 casos de fronteira)
  - `montarMensagemFalta` — texto correto para Ausente e Justificado
- **E2E (playwright):** `e2e/frequencia-alerta.spec.ts` — tela de estatísticas carrega; se houver aluno em queda, badge "Em queda" aparece, senão pula. Dashboard mostra o StatCard "Frequência em queda".

## Ordem de implementação

1. `lib/frequencia-alertas.ts` + testes (base compartilhada)
2. `getQtdeAlunosEmQueda` + StatCard no dashboard
3. Reconciliar `estatisticas-client.tsx` (usar função compartilhada + badge)
4. `notificarFaltas` + `montarMensagemFalta` + integração em `salvarFrequencia`
5. E2E

## Fora de escopo (YAGNI)

- Configurar o limite de 70% por turma/usuário (hardcoded com constante exportada por ora)
- Notificação para o portal (push) — esta entrega é só WhatsApp
- Histórico/relatório de notificações de falta enviadas
