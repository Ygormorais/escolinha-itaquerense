# Chatbot WhatsApp — Design Spec
**Data:** 2026-05-23  
**Status:** Aprovado

## Objetivo

Substituir o classificador de intenção por regex em `lib/whatsapp/ai-router.ts` por um chatbot real baseado em Claude (Anthropic), capaz de responder automaticamente aos responsáveis no WhatsApp com dados reais do banco (mensalidades, frequência, turma, eventos). Quando não souber responder, escala para atendimento humano.

---

## Arquitetura

```
Responsável (WhatsApp)
  → Evolution API webhook
  → /api/whatsapp/webhook
  → ai-router.ts (Claude claude-sonnet-4-6 + tool use)
      → tools.ts (queries Prisma)
  → resposta via Evolution API
```

### Componentes

| Arquivo | Responsabilidade |
|---------|-----------------|
| `lib/whatsapp/ai-router.ts` | Orquestração: identifica sessão, monta contexto, chama Claude, executa tools, envia resposta |
| `lib/whatsapp/tools.ts` | Implementação das 5 tools (queries no banco via Prisma) |
| `lib/whatsapp/session.ts` | CRUD de `ChatSession` — criar, buscar por telefone, expirar |
| `app/api/whatsapp/webhook/route.ts` | Chama `routeMessage()` do ai-router (substituindo regex) |
| `prisma/schema.prisma` | Novo modelo `ChatSession` |

---

## Identificação e Sessão

- Sessão identificada por número de telefone, TTL de 24h
- Primeira mensagem (ou sessão expirada): bot pede nome completo + CPF
- Sistema busca `Responsavel` pelo CPF e valida nome (case-insensitive, sem acentos)
- Encontrou: cria `ChatSession` com `responsavelId` → bot atende normalmente
- Não encontrou: responde que cadastro não foi localizado, sugere contato presencial

**Modelo `ChatSession`:**
```prisma
model ChatSession {
  id            Int       @id @default(autoincrement())
  telefone      String    @unique
  responsavelId Int?
  responsavel   Responsavel? @relation(fields: [responsavelId], references: [id])
  identificado  Boolean   @default(false)
  bloqueado     Boolean   @default(false)   // true após escalação, até admin reativar
  historico     String    @default("[]")    // JSON — últimas 10 mensagens
  expiresAt     DateTime
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

---

## Histórico de Conversa

- Últimas **10 mensagens** (5 turnos) passadas ao Claude a cada requisição
- Mensagens mais antigas descartadas do contexto, mantidas no banco (`WhatsAppMensagem`) para o admin
- Formato: array JSON `[{role, content}]` armazenado em `ChatSession.historico`

---

## Tools disponíveis para o Claude

### `buscar_pagamentos`
- **Input:** `alunoId: number`
- **Output:** lista de pagamentos com mês referência, vencimento, status (pago/pendente), valor

### `buscar_frequencia`
- **Input:** `alunoId: number, periodo?: "mes_atual" | "ultimo_mes"`
- **Output:** total de presenças, faltas e percentual no período

### `buscar_eventos`
- **Input:** `turma: string`
- **Output:** próximos 5 eventos/jogos/treinos da turma

### `buscar_turma`
- **Input:** `turma: string`
- **Output:** horários de treino e informações gerais da turma

### `escalonar_humano`
- **Input:** `motivo: string`
- **Output:** envia mensagem padrão ao responsável + cria notificação no painel admin
- **Efeito colateral:** seta `ChatSession.bloqueado = true` — bot para de responder até admin reativar

---

## Escalação para Humano

Quando `escalonar_humano` é chamado:

1. Responsável recebe no WhatsApp: *"Não consegui te ajudar com isso. Um atendente da Escolinha Itaquerense vai entrar em contato em breve."*
2. Admin vê notificação na página `/alunos/[id]/whatsapp-page` com: nome do responsável, número, motivo e trecho do histórico
3. Sessão é bloqueada (`bloqueado = true`) — bot ignora mensagens subsequentes
4. Admin reativa o bot via botão na notificação (chama endpoint que seta `bloqueado = false`)

---

## System Prompt do Claude

```
Você é o assistente virtual da Escolinha Itaquerense de Futebol.
Responda sempre em português brasileiro, de forma clara e amigável.
Você tem acesso a dados reais do aluno vinculado ao responsável identificado.
Use as tools disponíveis para buscar informações antes de responder.
Se não conseguir ajudar, chame escalonar_humano com o motivo.
Nunca invente informações — se não souber, escale para humano.
```

---

## Modelo e Custo

- **Modelo:** `claude-sonnet-4-6`
- **Prompt caching:** ativado no system prompt (estático, ideal para cache)
- **Limite de histórico:** 10 mensagens para controlar tokens por turno

---

## Arquivos modificados

### Criar
- `lib/whatsapp/ai-router.ts` (reescrever)
- `lib/whatsapp/tools.ts` (novo)
- `lib/whatsapp/session.ts` (novo)

### Modificar
- `app/api/whatsapp/webhook/route.ts` — chamar novo `routeMessage()`
- `prisma/schema.prisma` — adicionar `ChatSession`

### Não mudar
- `lib/whatsapp/evolution.ts`
- `lib/whatsapp/provider.ts`
- `lib/whatsapp/types.ts`
- Todos os server actions de envio
- Componentes UI

---

## Fora de escopo

- Interface de chat em tempo real no admin
- Suporte a mensagens de voz ou imagem
- Multi-idioma
- Chatbot para alunos (apenas responsáveis)
