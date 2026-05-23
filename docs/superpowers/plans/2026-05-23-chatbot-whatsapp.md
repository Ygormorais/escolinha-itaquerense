# Chatbot WhatsApp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o regex em `lib/whatsapp/ai-router.ts` por um chatbot real com Claude (claude-sonnet-4-6) que responde automaticamente responsáveis no WhatsApp usando tool use para buscar dados reais do banco.

**Architecture:** O webhook recebe a mensagem → `ai-router.ts` gerencia a sessão do responsável (identificação, histórico, bloqueio) → chama Claude com tool use → tools executam queries Prisma → resposta enviada via Evolution API.

**Tech Stack:** Next.js 16, Prisma (SQLite), `@anthropic-ai/sdk`, Evolution API, TypeScript

---

## File Map

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `package.json` | Modificar | Adicionar `@anthropic-ai/sdk` |
| `prisma/schema.prisma` | Modificar | Adicionar `cpf` em `Responsavel`, modelo `ChatSession` |
| `lib/whatsapp/session.ts` | Criar | CRUD de ChatSession (buscar, criar, atualizar, expirar) |
| `lib/whatsapp/tools.ts` | Criar | Implementação das 5 tools (queries Prisma) |
| `lib/whatsapp/ai-router.ts` | Reescrever | Orquestração Claude + tool use + envio de resposta |
| `app/api/whatsapp/webhook/route.ts` | Modificar | Adaptar para nova assinatura de `routeMessage` |
| `.env.local` | Modificar | Adicionar `ANTHROPIC_API_KEY` |

---

## Task 1: Instalar dependência e configurar env

**Files:**
- Modify: `package.json`
- Modify: `.env.local`

- [ ] **Step 1: Instalar `@anthropic-ai/sdk`**

```bash
cd C:\Users\Ygor\projetos\elite\escolinha-itaquerense
npm install @anthropic-ai/sdk
```

Expected: `added 1 package` (ou similar), sem erros.

- [ ] **Step 2: Adicionar `ANTHROPIC_API_KEY` no `.env.local`**

Abra `.env.local` e adicione ao final:

```
ANTHROPIC_API_KEY=sua_chave_aqui
```

> Obtenha sua chave em https://console.anthropic.com/

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install @anthropic-ai/sdk"
```

---

## Task 2: Atualizar schema Prisma

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Adicionar `cpf` em `Responsavel` e relação `chatSessions`**

No modelo `Responsavel` (linha ~103), altere para:

```prisma
model Responsavel {
  id           Int           @id @default(autoincrement())
  nome         String
  email        String        @unique
  telefone     String
  senha        String
  cpf          String?       @unique
  ativo        Boolean       @default(true)
  alunos       Aluno[]
  chatSessions ChatSession[]
  createdAt    DateTime      @default(now())
}
```

- [ ] **Step 2: Adicionar modelo `ChatSession` ao final do schema**

Adicione após o modelo `WhatsAppMensagem`:

```prisma
model ChatSession {
  id            Int          @id @default(autoincrement())
  telefone      String       @unique
  responsavelId Int?
  responsavel   Responsavel? @relation(fields: [responsavelId], references: [id])
  identificado  Boolean      @default(false)
  bloqueado     Boolean      @default(false)
  historico     String       @default("[]")
  expiresAt     DateTime
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
}
```

- [ ] **Step 3: Gerar migration e client**

```bash
npx prisma migrate dev --name add_chat_session_cpf
npx prisma generate
```

Expected: `✔ Generated Prisma Client` sem erros.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(db): add ChatSession model and cpf to Responsavel"
```

---

## Task 3: Criar `lib/whatsapp/session.ts`

**Files:**
- Create: `lib/whatsapp/session.ts`

- [ ] **Step 1: Criar o arquivo**

```typescript
// lib/whatsapp/session.ts
import { db } from "@/lib/db"

const SESSION_TTL_HOURS = 24

export async function getSession(telefone: string) {
  const session = await db.chatSession.findUnique({ where: { telefone } })
  if (!session) return null
  if (session.expiresAt < new Date()) {
    await db.chatSession.delete({ where: { telefone } })
    return null
  }
  return session
}

export async function createSession(telefone: string) {
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + SESSION_TTL_HOURS)
  return db.chatSession.upsert({
    where: { telefone },
    create: { telefone, expiresAt },
    update: { expiresAt, identificado: false, bloqueado: false, historico: "[]" },
  })
}

export async function identifySession(telefone: string, responsavelId: number) {
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + SESSION_TTL_HOURS)
  return db.chatSession.update({
    where: { telefone },
    data: { responsavelId, identificado: true, expiresAt },
  })
}

export async function appendHistory(
  telefone: string,
  role: "user" | "assistant",
  content: string
) {
  const session = await db.chatSession.findUnique({ where: { telefone } })
  if (!session) return
  const history: { role: string; content: string }[] = JSON.parse(session.historico)
  history.push({ role, content })
  const trimmed = history.slice(-10) // keep last 10 messages
  await db.chatSession.update({
    where: { telefone },
    data: { historico: JSON.stringify(trimmed) },
  })
}

export async function blockSession(telefone: string) {
  return db.chatSession.update({
    where: { telefone },
    data: { bloqueado: true },
  })
}

export async function unblockSession(telefone: string) {
  return db.chatSession.update({
    where: { telefone },
    data: { bloqueado: false },
  })
}
```

- [ ] **Step 2: Verificar que não há erro de tipo**

```bash
npx tsc --noEmit
```

Expected: sem erros relacionados a `session.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/whatsapp/session.ts
git commit -m "feat(chatbot): add ChatSession CRUD (session.ts)"
```

---

## Task 4: Criar `lib/whatsapp/tools.ts`

**Files:**
- Create: `lib/whatsapp/tools.ts`

- [ ] **Step 1: Criar o arquivo**

```typescript
// lib/whatsapp/tools.ts
import { db } from "@/lib/db"
import type Anthropic from "@anthropic-ai/sdk"

export const TOOL_DEFINITIONS: Anthropic.Tool[] = [
  {
    name: "buscar_pagamentos",
    description: "Busca as mensalidades do aluno: status (pago/pendente), vencimento e valor.",
    input_schema: {
      type: "object",
      properties: {
        alunoId: { type: "number", description: "ID do aluno no banco" },
      },
      required: ["alunoId"],
    },
  },
  {
    name: "buscar_frequencia",
    description: "Busca presenças e faltas do aluno no período informado.",
    input_schema: {
      type: "object",
      properties: {
        alunoId: { type: "number", description: "ID do aluno no banco" },
        periodo: {
          type: "string",
          enum: ["mes_atual", "ultimo_mes"],
          description: "Período a consultar. Padrão: mes_atual.",
        },
      },
      required: ["alunoId"],
    },
  },
  {
    name: "buscar_eventos",
    description: "Busca os próximos 5 eventos, jogos ou treinos da turma.",
    input_schema: {
      type: "object",
      properties: {
        turma: { type: "string", description: "Nome da turma, ex: Sub-13" },
      },
      required: ["turma"],
    },
  },
  {
    name: "buscar_turma",
    description: "Busca informações e horários da turma do aluno.",
    input_schema: {
      type: "object",
      properties: {
        turma: { type: "string", description: "Nome da turma, ex: Sub-13" },
      },
      required: ["turma"],
    },
  },
  {
    name: "escalonar_humano",
    description:
      "Chama quando não consegue responder. Notifica o admin e para de responder automaticamente.",
    input_schema: {
      type: "object",
      properties: {
        motivo: { type: "string", description: "Motivo pelo qual não conseguiu ajudar" },
      },
      required: ["motivo"],
    },
  },
]

type ToolInput = Record<string, unknown>

export async function executeTool(name: string, input: ToolInput): Promise<string> {
  switch (name) {
    case "buscar_pagamentos": {
      const alunoId = input.alunoId as number
      const pagamentos = await db.pagamento.findMany({
        where: { alunoId },
        orderBy: { dataVencimento: "desc" },
        take: 6,
      })
      if (!pagamentos.length) return "Nenhuma mensalidade encontrada para este aluno."
      return pagamentos
        .map((p) => {
          const status = p.dataPagamento ? "✅ Pago" : "⏳ Pendente"
          const venc = p.dataVencimento.toLocaleDateString("pt-BR")
          const valor = p.valorRecebido ?? 0
          return `• ${p.mesReferencia} — ${status} — Vencimento: ${venc} — R$ ${valor.toFixed(2)}`
        })
        .join("\n")
    }

    case "buscar_frequencia": {
      const alunoId = input.alunoId as number
      const periodo = (input.periodo as string) ?? "mes_atual"
      const now = new Date()
      const start = new Date(now.getFullYear(), periodo === "mes_atual" ? now.getMonth() : now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), periodo === "mes_atual" ? now.getMonth() + 1 : now.getMonth(), 0)

      const frequencias = await db.frequencia.findMany({
        where: { alunoId, data: { gte: start, lte: end } },
      })
      const total = frequencias.length
      const presencas = frequencias.filter((f) => f.presenca === "presente").length
      const faltas = total - presencas
      const pct = total > 0 ? Math.round((presencas / total) * 100) : 0
      const label = periodo === "mes_atual" ? "este mês" : "mês passado"
      return `Frequência ${label}: ${presencas} presenças, ${faltas} faltas (${pct}% de presença).`
    }

    case "buscar_eventos": {
      const turma = input.turma as string
      const eventos = await db.evento.findMany({
        where: {
          data: { gte: new Date() },
          OR: [{ turmas: { contains: turma } }, { turmas: "Todas" }],
        },
        orderBy: { data: "asc" },
        take: 5,
      })
      if (!eventos.length) return "Nenhum evento programado para a turma nos próximos dias."
      return eventos
        .map((e) => {
          const data = e.data.toLocaleDateString("pt-BR")
          const hora = e.horaInicio ?? ""
          return `• ${e.tipo} — ${e.titulo} — ${data}${hora ? ` às ${hora}` : ""}${e.local ? ` — ${e.local}` : ""}`
        })
        .join("\n")
    }

    case "buscar_turma": {
      const turma = input.turma as string
      const alunos = await db.aluno.findMany({
        where: { turma, status: "Ativo" },
        select: { horario: true },
        take: 1,
      })
      if (!alunos.length) return `Nenhuma informação encontrada para a turma ${turma}.`
      return `Turma: ${turma}\nHorário: ${alunos[0].horario}`
    }

    case "escalonar_humano":
      return "__ESCALAR__"

    default:
      return "Tool desconhecida."
  }
}
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

Expected: sem erros em `tools.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/whatsapp/tools.ts
git commit -m "feat(chatbot): add tool definitions and execution (tools.ts)"
```

---

## Task 5: Reescrever `lib/whatsapp/ai-router.ts`

**Files:**
- Modify: `lib/whatsapp/ai-router.ts`

- [ ] **Step 1: Substituir o conteúdo do arquivo pelo novo orquestrador**

```typescript
// lib/whatsapp/ai-router.ts
import Anthropic from "@anthropic-ai/sdk"
import { db } from "@/lib/db"
import { getSession, createSession, identifySession, appendHistory, blockSession } from "./session"
import { TOOL_DEFINITIONS, executeTool } from "./tools"
import { getProvider } from "./provider"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Você é o assistente virtual da Escolinha Itaquerense de Futebol.
Responda sempre em português brasileiro, de forma clara e amigável.
Você tem acesso a dados reais do aluno vinculado ao responsável identificado.
Use as tools disponíveis para buscar informações antes de responder.
Se não conseguir ajudar, chame escalonar_humano com o motivo.
Nunca invente informações — se não souber, escale para humano.`

function normalizeText(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
}

async function identificarResponsavel(telefone: string, texto: string): Promise<string> {
  const session = await getSession(telefone)

  if (!session) {
    await createSession(telefone)
    return "Olá! Antes de continuar, preciso identificar você. Por favor, informe seu *nome completo* e *CPF* (somente números)."
  }

  if (!session.identificado) {
    const partes = texto.split(/\s+/)
    const cpf = partes.find((p) => /^\d{11}$/.test(p))
    if (!cpf) {
      return "Não consegui identificar seu CPF. Por favor, envie seu *nome completo* seguido do *CPF* (somente números, sem pontos ou traço). Exemplo: João Silva 12345678900"
    }

    const responsavel = await db.responsavel.findFirst({ where: { cpf } })
    if (!responsavel) {
      return "Cadastro não encontrado. Por favor, compareça pessoalmente à Escolinha ou ligue para nós."
    }

    const nomeEnviado = normalizeText(texto.replace(cpf, ""))
    const nomeCadastrado = normalizeText(responsavel.nome)
    if (!nomeCadastrado.includes(nomeEnviado.split(" ")[0])) {
      return "Nome não confere com o CPF informado. Tente novamente."
    }

    await identifySession(telefone, responsavel.id)
    return `Olá, ${responsavel.nome.split(" ")[0]}! Identificação confirmada. Como posso te ajudar? Posso consultar mensalidades, frequência, horários e próximos eventos do seu filho(a).`
  }

  return ""
}

export async function routeMessage(telefone: string, texto: string) {
  const session = await getSession(telefone)

  // Sessão bloqueada (aguarda atendimento humano)
  if (session?.bloqueado) return

  // Identificação — retorna mensagem se ainda não identificado
  const identificacaoMsg = await identificarResponsavel(telefone, texto)
  if (identificacaoMsg) {
    const provider = getProvider()
    await provider.sendText({ telefone, mensagem: identificacaoMsg })
    await db.whatsAppMensagem.create({
      data: {
        telefone,
        mensagem: identificacaoMsg,
        direcao: "outgoing",
        status: "sent",
        instancia: process.env.EVOLUTION_INSTANCE ?? "escolinha",
        origem: "ai-router",
      },
    })
    await appendHistory(telefone, "user", texto)
    await appendHistory(telefone, "assistant", identificacaoMsg)
    return
  }

  // Buscar dados do responsável e aluno vinculado
  const currentSession = await getSession(telefone)
  const responsavel = currentSession?.responsavelId
    ? await db.responsavel.findUnique({
        where: { id: currentSession.responsavelId },
        include: { alunos: { where: { status: "Ativo" }, take: 1 } },
      })
    : null

  const aluno = responsavel?.alunos?.[0]

  // Montar histórico e contexto
  const history: { role: "user" | "assistant"; content: string }[] = JSON.parse(
    currentSession?.historico ?? "[]"
  )
  await appendHistory(telefone, "user", texto)

  const contexto = aluno
    ? `\n\nContexto do responsável identificado:\n- Responsável: ${responsavel?.nome}\n- Aluno: ${aluno.nome} (ID: ${aluno.id})\n- Turma: ${aluno.turma}`
    : ""

  const messages: Anthropic.MessageParam[] = [
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: texto },
  ]

  // Agentic loop com tool use
  let response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT + contexto,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: TOOL_DEFINITIONS,
    messages,
  })

  while (response.stop_reason === "tool_use") {
    const toolUses = response.content.filter((b) => b.type === "tool_use")
    const toolResults: Anthropic.MessageParam = {
      role: "user",
      content: await Promise.all(
        toolUses.map(async (block) => {
          if (block.type !== "tool_use") return { type: "tool_result" as const, tool_use_id: "", content: "" }
          const result = await executeTool(block.name, block.input as Record<string, unknown>)
          return {
            type: "tool_result" as const,
            tool_use_id: block.id,
            content: result,
          }
        })
      ),
    }

    // Se alguma tool retornou __ESCALAR__, tratar escalação
    const escalar = toolUses.find((b) => b.type === "tool_use" && b.name === "escalonar_humano")
    if (escalar && escalar.type === "tool_use") {
      const motivo = (escalar.input as { motivo: string }).motivo
      await blockSession(telefone)
      const msgEscalacao =
        "Não consegui te ajudar com isso. Um atendente da Escolinha Itaquerense vai entrar em contato em breve."
      const provider = getProvider()
      await provider.sendText({ telefone, mensagem: msgEscalacao })
      await db.whatsAppMensagem.create({
        data: {
          telefone,
          alunoId: aluno?.id,
          mensagem: msgEscalacao,
          direcao: "outgoing",
          status: "sent",
          instancia: process.env.EVOLUTION_INSTANCE ?? "escolinha",
          origem: "ai-router",
          intent: "escalacao",
        },
      })
      // Notificação para admin via Log
      await db.log.create({
        data: {
          tipo: "escalacao_chatbot",
          descricao: `Responsável ${responsavel?.nome ?? telefone} (${telefone}) precisou de atendimento humano.`,
          meta: JSON.stringify({ motivo, telefone, responsavelId: currentSession?.responsavelId }),
        },
      })
      await appendHistory(telefone, "assistant", msgEscalacao)
      return
    }

    messages.push({ role: "assistant", content: response.content })
    messages.push(toolResults)

    response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT + contexto,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: TOOL_DEFINITIONS,
      messages,
    })
  }

  // Extrair texto final da resposta
  const respostaTexto = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("\n")
    .trim()

  if (!respostaTexto) return

  // Enviar resposta ao responsável
  const provider = getProvider()
  await provider.sendText({ telefone, mensagem: respostaTexto })

  // Persistir no banco
  await db.whatsAppMensagem.create({
    data: {
      telefone,
      alunoId: aluno?.id,
      mensagem: respostaTexto,
      direcao: "outgoing",
      status: "sent",
      instancia: process.env.EVOLUTION_INSTANCE ?? "escolinha",
      origem: "ai-router",
    },
  })

  await appendHistory(telefone, "assistant", respostaTexto)
}
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

Expected: sem erros em `ai-router.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/whatsapp/ai-router.ts
git commit -m "feat(chatbot): rewrite ai-router with Claude tool use"
```

---

## Task 6: Atualizar webhook

**Files:**
- Modify: `app/api/whatsapp/webhook/route.ts`

- [ ] **Step 1: Atualizar a chamada a `routeMessage`**

A nova assinatura de `routeMessage` é `(telefone: string, texto: string)` — não recebe mais `alunoId`.

Substitua o bloco `if (event === "MESSAGE" ...)` por:

```typescript
if (event === "MESSAGE" && data?.key?.remoteJid) {
  const telefone = data.key.remoteJid.replace(/@s\.whatsapp\.net$/, "")
  const texto = data.message?.conversation || data.message?.extendedTextMessage?.text || ""
  const messageId = data.key.id

  if (!texto) return NextResponse.json({ ok: true })

  // Salvar mensagem recebida no banco
  await db.whatsAppMensagem.create({
    data: {
      telefone,
      mensagem: texto,
      direcao: "incoming",
      status: "received",
      instancia: instance ?? "escolinha",
      origem: "webhook",
      messageId,
    },
  })

  // Processar com AI router (não bloqueia a resposta do webhook)
  routeMessage(telefone, texto).catch((err) =>
    console.error("AI router error:", err)
  )
}
```

> Nota: `routeMessage` é chamado sem `await` para não bloquear o webhook — a Evolution API espera resposta rápida.

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add app/api/whatsapp/webhook/route.ts
git commit -m "feat(chatbot): update webhook to use new routeMessage signature"
```

---

## Task 7: Endpoint para reativar bot (pós-escalação)

**Files:**
- Create: `app/api/whatsapp/reativar/route.ts`

- [ ] **Step 1: Criar o endpoint**

```typescript
// app/api/whatsapp/reativar/route.ts
import { NextRequest, NextResponse } from "next/server"
import { unblockSession } from "@/lib/whatsapp/session"

export async function POST(req: NextRequest) {
  const { telefone } = await req.json()
  if (!telefone) return NextResponse.json({ error: "telefone obrigatório" }, { status: 400 })
  await unblockSession(telefone)
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/whatsapp/reativar/route.ts
git commit -m "feat(chatbot): add reativar endpoint to unblock session after escalation"
```

---

## Task 8: Smoke test manual

- [ ] **Step 1: Verificar build sem erros**

```bash
npx tsc --noEmit
```

Expected: zero erros.

- [ ] **Step 2: Subir o servidor**

```bash
npm run dev
```

Expected: `✓ Ready` sem erros de módulo.

- [ ] **Step 3: Testar webhook manualmente**

Simule uma mensagem recebida via `curl` (ou use o Postman):

```bash
curl -X POST http://localhost:3000/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "MESSAGE",
    "instance": "escolinha",
    "data": {
      "key": { "remoteJid": "5511999999999@s.whatsapp.net", "fromMe": false, "id": "TEST123" },
      "message": { "conversation": "Oi" }
    }
  }'
```

Expected: `{"ok":true}` e no banco (`WhatsAppMensagem`) uma entrada com `direcao: "incoming"`.

- [ ] **Step 4: Verificar que bot pede identificação**

Verifique nos logs do servidor que o AI router foi chamado e tentou enviar mensagem de identificação (vai falhar se `EVOLUTION_API_URL` não estiver configurado — é esperado em ambiente de dev sem Evolution API real).

- [ ] **Step 5: Commit final + PR**

```bash
git add .
git commit -m "chore: smoke test passed — chatbot MVP completo"
git push origin develop
```

Abrir PR de `develop` → `master`.
