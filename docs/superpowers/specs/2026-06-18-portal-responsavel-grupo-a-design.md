# Portal do Responsável — Grupo A: Histórico de Pagamentos, Uniforme e Próximos Eventos

**Data:** 2026-06-18  
**Status:** Aprovado

## Contexto

Três melhorias no portal do responsável que não exigem migration de banco. Dados já existem — falta expô-los de forma mais útil para os pais.

---

## Feature 1 — Widget "Últimos 6 meses" no dashboard

### O que muda

No `dashboard-client.tsx`, após os cards de aluno existentes, adicionar um bloco de histórico mensal por aluno com 6 pills coloridas representando os meses mais recentes.

### Lógica

- Calcular os 6 meses anteriores ao mês atual (inclusive o atual) em ordem decrescente
- Para cada mês, buscar o `Pagamento` do aluno com `mesReferencia === "YYYY-MM"`
- Status:
  - **Pago** (verde) — `dataPagamento !== null`
  - **Pendente** (amarelo) — `dataPagamento === null` e `dataVencimento >= hoje`
  - **Atrasado** (vermelho) — `dataPagamento === null` e `dataVencimento < hoje`
  - **Sem registro** (cinza) — nenhum `Pagamento` para aquele mês
- Pills com abreviação do mês (jan, fev…) e tooltip com status completo
- Clique na pill ou no bloco leva para `/responsavel/mensalidades`

### Dados

Os `pagamentos` já estão no `include` do `page.tsx` (todos os pagamentos). Filtrar client-side pelo intervalo de 6 meses — sem query nova.

### Componente

`components/responsavel/historico-pagamentos.tsx` — recebe `pagamentos: Pagamento[]` e `aluno: { nome: string }`.

---

## Feature 2 — Página `/responsavel/uniformes`

### O que muda

Nova página e nav item. Nenhum schema novo.

### Rota

`app/responsavel/uniformes/page.tsx` (server component) + `uniformes-client.tsx`

### Dados

```ts
db.responsavel.findUnique({
  where: { id: session.responsavelId },
  include: {
    alunos: {
      where: { status: "Ativo" },
      include: { uniformes: { orderBy: { createdAt: "asc" } } },
    },
  },
})
```

### UI

- Header vermelho padrão do portal (mesmo visual de `/responsavel/mensalidades`)
- Por aluno: card com tabela de itens (Item | Tamanho | Status | Data de Entrega)
- Badge "Entregue" (verde) / "Pendente" (amarelo)
- Se aluno não tem nenhum uniforme: empty state "Nenhum item registrado"
- Botão "Solicitar item" → link para `/responsavel/solicitacoes` (sistema já existe)
- Estado vazio geral (nenhum filho): mensagem amigável

### Nav

Adicionar `{ href: "/responsavel/uniformes", label: "Uniforme" }` em `nav-responsavel.tsx`, entre "Desempenho" e "Boletim".

---

## Feature 3 — Card "Próximos eventos" no dashboard

### O que muda

No dashboard (`page.tsx` + `dashboard-client.tsx`), novo card "Próximos eventos" mostrando os próximos 3 itens relevantes para os filhos do responsável.

### Fontes de dados (em paralelo)

1. **Jogos convocados:** `EscalacaoJogador` onde `aluno.responsavelId === session.responsavelId`, `convocadoEm !== null`, `partida.data >= hoje` — orderBy `data asc`, take 5
2. **Eventos do clube:** `Evento` onde `data >= hoje` e `status !== "cancelado"` — filtrar por turma do aluno (`turmas === "Todas"` OU `turmas` contém a turma do filho) — orderBy `data asc`, take 5

### Merge e exibição

- Combinar as duas listas, ordenar por data, pegar os próximos 3
- Cada item: ícone por tipo (🏆 jogo, 📣 evento/reunião, ⚽ treino), data formatada, título/adversário, badge de tipo
- Se convocação: mostrar nome do filho e link para confirmar RSVP se ainda não respondeu
- Se vazio: "Nenhum evento nos próximos 30 dias"
- Link "Ver calendário completo" → `/responsavel/calendario`

### Dados no page.tsx

Duas queries novas passadas como prop `proximosEventos` para o `DashboardClient`. Filtro de 30 dias aplicado server-side.

---

## Testes

- **Unit (vitest):** lógica de status dos 6 meses (pago/pendente/atrasado/sem registro) em `historico-pagamentos.test.ts`
- **E2E (playwright):** `e2e/responsavel-uniformes.spec.ts` — login, navegar para /uniformes, ver itens ou empty state; `e2e/responsavel-dashboard-eventos.spec.ts` — card de próximos eventos aparece no dashboard

## Ordem de implementação

1. Feature 1 (widget histórico) — menor superfície, só client component
2. Feature 2 (uniforme) — nova rota + nav
3. Feature 3 (próximos eventos) — query nova no dashboard
