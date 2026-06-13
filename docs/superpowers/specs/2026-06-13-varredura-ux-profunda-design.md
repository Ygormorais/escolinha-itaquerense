# Varredura UX Profunda — 6 Páginas de Alto Impacto

**Data:** 2026-06-13  
**Abordagem:** Opção B — auditoria por página crítica com análise de estados

---

## Contexto

O app já passou por 3 lotes de polimento UX (06–12/06): plurais, caixa, onboarding,
uniformes, custos, turmas, dark mode e mobile do admin. Esta rodada vai fundo em 6 páginas
de uso diário que ainda não foram auditadas em detalhe.

---

## Páginas no Escopo

| # | Página | Rota | Por quê é crítica |
|---|--------|------|-------------------|
| 1 | Frequência | `/frequencia` | Usada toda aula; fluxo de 2 etapas pode travar |
| 2 | Pagamentos | `/pagamentos` | Crítica financeiramente; tabela com muitos estados |
| 3 | Alunos | `/alunos` | CRUD principal; formulário grande, filtros, paginação |
| 4 | Comunicados | `/comunicados` | Envio em massa + histórico; ação irreversível |
| 5 | Inadimplência | `/inadimplencia` | Relatório gerencial; muito dado, pouco feedback |
| 6 | Secretaria | `/secretaria` | Visão diária da secretaria; ponto de entrada operacional |

---

## Critérios de Auditoria

Para cada página, verificar e corrigir:

### 1. Estado Vazio
- Existe `EmptyState` com mensagem contextual (não genérica)?
- O estado vazio orienta a próxima ação ("Nenhum aluno cadastrado — [Adicionar aluno]")?

### 2. Estado de Erro
- Erros de action chegam via `toast.error()` com mensagem legível?
- Validação de formulário exibe `FormMessage` por campo (não só toast global)?
- Erros de carregamento de dados têm fallback visível?

### 3. Feedback de Ação
- Botões de submit ficam `disabled` + mostram spinner durante `isPending`?
- Actions destrutivas (deletar, inativar) têm `ConfirmDialog`?
- Sucesso é confirmado com `toast.success()` antes de `router.refresh()`?

### 4. Loading States
- Suspense boundaries com skeleton adequado ao layout da página?
- Skeleton tem dimensões parecidas com o conteúdo real (evita CLS)?
- Não mistura `loading.tsx` com spinner inline sem critério?

### 5. Responsividade Mobile
- Tabelas longas têm scroll horizontal ou colapso em cards no mobile?
- Formulários em Dialog não ultrapassam viewport em telas estreitas?
- Botões de ação têm área de toque ≥ 44px?

### 6. Acessibilidade Básica
- Todos os inputs têm `<label>` explícito ou `aria-label`?
- Botões de ícone têm `aria-label` ou `title`?
- Selects e inputs têm `id` correspondente ao `htmlFor` do label?

### 7. Consistência Visual
- Nenhuma cor raw Tailwind (usar tokens: `text-foreground`, `bg-card`, etc.)?
- Espaçamento segue padrão `p-6 / gap-6` das outras páginas?
- `PageHeader` com `title` + `description` presentes?

---

## Regras de Implementação

- **Um commit por página** — facilita bisect e revisão
- **Não alterar lógica de negócio** — só apresentação, feedback e acessibilidade
- **Não adicionar features** — se encontrar gap funcional, registrar como TODO no commit message
- **Testes**: se alguma correção mudar comportamento de componente testado, rodar `npm test` antes de commitar
- **Sem regressões E2E**: rodar `npx playwright test --grep frequencia|pagamentos|alunos|comunicados|inadimplencia|secretaria` após cada lote

---

## Critério de Conclusão

Cada página está "done" quando:
- [ ] Todos os 7 critérios passam ou são explicitamente marcados como N/A
- [ ] Sem erros de console na página
- [ ] Screenshot mobile + desktop validado visualmente

---

## Achados Pré-Conhecidos (do contexto anterior)

- `frequencia-client.tsx`: fluxo de 2 etapas (selecionar turma/data → carregar) não dá feedback de "nenhum aluno nessa turma"
- `resultados/page.tsx`: usa CSS inline em vez de Tailwind — fora do escopo desta varredura (página pública separada)
- `responsavel/`: já varrido em 12/06, sem pendências conhecidas
