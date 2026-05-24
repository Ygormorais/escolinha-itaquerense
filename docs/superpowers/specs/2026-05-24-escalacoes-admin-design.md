# Notificações de Escalação no Admin — Design Spec
**Data:** 2026-05-24
**Status:** Aprovado

## Objetivo

Quando o chatbot escalar uma conversa para atendimento humano, o admin deve ver um badge no menu lateral indicando escalações pendentes e poder reativar o bot diretamente.

---

## Arquitetura

| Arquivo | Ação |
|---------|------|
| `components/layout/sidebar.tsx` (ou equivalente) | Buscar contagem de ChatSession bloqueadas e exibir badge |
| `app/configuracoes/escalacoes/page.tsx` | Criar página com lista de escalações pendentes |
| `app/actions/escalacoes.ts` | Server actions: listar escalações + reativar sessão |

---

## Badge no Sidebar

- O sidebar busca `db.chatSession.count({ where: { bloqueado: true } })` como server component
- Exibe badge vermelho com o número ao lado do item de navegação WhatsApp/Chatbot
- Se contagem = 0, badge não é renderizado
- Badge leva para `/configuracoes/escalacoes`

---

## Página `/configuracoes/escalacoes`

Página server component que renderiza:

```
Escalações Pendentes (N)

[ Tabela ]
| Responsável | Número | Motivo | Data | Ações |
|-------------|--------|--------|------|-------|
| João Silva  | 5511…  | "Dúvida sobre contrato" | 24/05 | [Reativar bot] |
```

### Dados

- Busca `ChatSession` com `bloqueado: true`, include `responsavel`
- Motivo: busca `Log` mais recente com `tipo: "escalacao_chatbot"` e `meta` contendo o `telefone` da sessão — extrai campo `motivo` do JSON
- Ordenado por `updatedAt` desc (mais recente primeiro)

### Botão "Reativar bot"

- Server action `reativarEscalacao(telefone: string)`:
  1. Chama `db.chatSession.update({ where: { telefone }, data: { bloqueado: false } })`
  2. Chama `revalidatePath("/configuracoes/escalacoes")`
  3. Retorna `{ success: true }`
- Após reativar, o responsável pode voltar a interagir com o bot normalmente

---

## Dados necessários no Log

O log de escalação já é criado em `ai-router.ts`:
```typescript
await db.log.create({
  data: {
    tipo: "escalacao_chatbot",
    descricao: `Responsável ${responsavel?.nome ?? telefone} (${telefone}) precisou de atendimento humano.`,
    meta: JSON.stringify({ motivo, telefone, responsavelId }),
  },
})
```

A página de escalações usa `meta` (JSON) para extrair `motivo` e `telefone`.

---

## Fora de Escopo

- Notificações push/email para o admin
- Histórico de escalações já resolvidas (só pendentes)
- Atribuição de escalação a um atendente específico
- Chat em tempo real com o responsável
