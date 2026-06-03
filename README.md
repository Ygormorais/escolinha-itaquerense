# Escolinha Itaquerense

Sistema de gestão para escolinha de futebol E.C. Itaquerense — cadastro de alunos, pagamentos, frequência, campeonatos, uniformes, comunicados via WhatsApp e portal do responsável.

## Stack

- **Framework:** Next.js 16.2.6 (App Router, React 19)
- **UI:** Tailwind CSS v4 + shadcn/ui + @base-ui/react
- **Banco:** Prisma 7 + SQLite (dev) / PostgreSQL (produção)
- **Auth:** HMAC-SHA256 sessions + bcryptjs
- **IA:** Claude API (chatbot WhatsApp)
- **Dashboard:** Recharts
- **Testes:** Vitest + Playwright

## Pré-requisitos

- Node.js 20+
- npm 9+

## Setup

```bash
npm install
cp .env.example .env.local  # configure suas variáveis
npx prisma generate
npx next dev
```

Acesse `http://localhost:3000` — login padrão: `admin` / `escolinha123`

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Servidor de produção |
| `npm run lint` | ESLint |
| `npm test` | Testes unitários (vitest) |
| `npm run test:e2e` | Testes E2E (Playwright) |
| `npm run db:backup` | Backup do banco |
| `npm run db:restore` | Restaura backup |
| `npm run db:migrate` | Aplica migrations |
| `npm run db:studio` | Prisma Studio |
| `npm run housekeeping` | Limpeza de dados antigos |

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `SESSION_SECRET` | Chave para assinar cookies de sessão |
| `ADMIN_USER` | Usuário admin (fallback env) |
| `ADMIN_PASS` | Senha admin (fallback env) |
| `ANTHROPIC_API_KEY` | API key do Claude (chatbot) |
| `CLAUDE_MODEL` | Modelo Claude (default: claude-sonnet-4-20250514) |
| `EVOLUTION_API_URL` | URL da Evolution API |
| `EVOLUTION_API_KEY` | API key da Evolution |
| `EVOLUTION_INSTANCE` | Instância Evolution |
| `DATABASE_URL` | PostgreSQL URL (produção) |
| `NEXT_PUBLIC_APP_URL` | URL pública do app |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service Account Google |
| `GOOGLE_PRIVATE_KEY` | Chave privada Google |
| `CRON_SECRET` | Secret para endpoints cron |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | SMTP para emails |

## Funcionalidades

### Admin
- Dashboard com gráficos (receita, inadimplência, ocupação)
- CRUD completo: alunos, pagamentos, custos, eventos, uniformes
- Caixa: PIX, boleto, maquininha (import CSV), descontos
- Campeonatos: inscrições, partidas, classificação
- Relatórios financeiros, de alunos e frequência (CSV / PDF)
- Histórico de auditoria
- Comunicados em massa via WhatsApp
- Chatbot IA (Claude) com identificação por CPF
- Controle de acesso por função (admin, secretaria, técnico)
- Gestão de pré-matrículas online
- Solicitações dos responsáveis

### Portal do Responsável
- Dashboard com resumo dos filhos
- Mensalidades mês a mês
- Frequência, uniformes, carteirinha digital
- Boletim com notas técnicas, físicas e comportamentais
- Jogos, classificação, desempenho
- Galeria de mídia e vídeos
- Notificações push
- Envio de solicitações
- Recuperação de senha

### WhatsApp / Chatbot
- Identificação por nome + CPF
- Consulta de mensalidades, frequência, eventos
- Informações de uniformes, carteirinha
- Campeonatos e comunicados
- Escalação para atendimento humano

## Estrutura do Projeto

```
app/                    # Next.js App Router
  actions/              # Server Actions
  api/                  # API Routes
  alunos/               # CRUD alunos
  caixa/                # Caixa financeiro
  campeonatos/          # Campeonatos
  configuracoes/        # Configurações
  frequencia/           # Frequência
  responsavel/          # Portal do responsável
  relatorio/            # Relatórios
  matricula/            # Pré-matrícula pública
components/            # Componentes React
  dashboard/            # Dashboard widgets
  layout/               # Sidebar, header, bottom nav
  onboarding/           # Tour guiado
  responsavel/          # Componentes do portal
  ui/                   # shadcn/ui components
  whatsapp/             # WhatsApp components
lib/                   # Utilitários
  whatsapp/             # Evoluion API, chatbot, tools
  __tests__/            # Testes unitários
prisma/                # Schema + migrations
public/                # Assets estáticos
scripts/               # Scripts utilitários
e2e/                   # Testes Playwright
```
