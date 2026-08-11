# Onboarding — Escolinha Itaquerense

Guia para colocar o projeto rodando do zero e entender como ele funciona.

---

## 1. Visão Geral

O sistema é uma aplicação web de gestão completa para a escolinha de futebol E.C. Itaquerense. Ele cobre o ciclo operacional inteiro: cadastro e matrícula de alunos, controle de mensalidades (PIX, boleto e maquininha de cartão via Mercado Pago), frequência, uniformes, campeonatos com integração à FPFS, comunicados e um chatbot via WhatsApp (Evolution API + Claude).

Há dois perfis de acesso: o **painel admin** (gestores, secretaria, técnicos) e o **portal do responsável** (pais consultam mensalidades, frequência, boletim, jogos e recebem notificações push). O sistema também expõe uma página pública de **pré-matrícula** e um endpoint de **webhook** para receber mensagens do WhatsApp.

A stack é Next.js 16.3 (App Router) + Tailwind CSS v4 + Prisma 7. O banco é
SQLite tanto no desenvolvimento (`prisma/dev.db`) quanto na VPS de produção,
onde fica fora do checkout em `/var/lib/escolinha/prod.db`. O deploy oficial é
de instância única com Node/PM2/Caddy; veja `DEPLOY.md`.

---

## 2. Setup Local

### Pré-requisitos

- **Node.js 22.x** (verifique com `node -v`; é a mesma versão da CI e da VPS)
- **npm 9+** (vem junto com o Node)
- SQLite não precisa de instalação separada — o driver `better-sqlite3` é instalado pelo npm

### Passo a passo

```bash
# 1. Clone o repositório e entre no diretório
git clone https://github.com/Ygormorais/escolinha-itaquerense.git
cd escolinha-itaquerense

# 2. Use a branch de desenvolvimento
git checkout develop

# 3. Instale as dependências (o postinstall roda prisma generate automaticamente)
npm install

# 4. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local — veja a seção 3 para saber quais são obrigatórias

# 5. Crie o banco e aplique as migrations
npx prisma migrate dev

# 6. (Opcional) Popule o banco com dados de teste
npx tsx prisma/seed.ts

# 7. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:3000`. O login padrão usa as credenciais definidas em `ADMIN_USERNAME` / `ADMIN_PASSWORD` no `.env.local` (fallback de ambiente). Se não definidas, o app lê as variáveis do arquivo `.env.example` como padrão — defina-as explicitamente para evitar surpresas.

### Rodando testes

```bash
# Testes unitários (Vitest)
npm test

# Testes E2E (Playwright — requer o servidor rodando em outro terminal)
npm run dev          # terminal 1
npx playwright test  # terminal 2
```

> **Atenção CI:** O Vitest com `better-sqlite3` pode travar em ambientes Linux CI. Consulte a nota em `/memory/ci-vitest-hang.md` se encontrar esse problema.

---

## 3. Variáveis de Ambiente

Copie `.env.example` para `.env.local` no desenvolvimento. Na VPS, use
`.env.production.example` como base para o `.env` de produção com modo `600`.

| Variável | Obrigatória | Descrição | Exemplo |
|---|---|---|---|
| `ADMIN_USERNAME` | Sim | Usuário admin via env (fallback se não houver usuário no banco) | `admin` |
| `ADMIN_PASSWORD` | Sim | Senha admin via env — **troque em produção** | `senha-segura-aqui` |
| `SESSION_SECRET` | Sim | Chave HMAC para assinar cookies de sessão (32 bytes hex) | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `DATABASE_URL` | Sim | Caminho do SQLite ou URL do PostgreSQL | `file:/app/prisma/dev.db` |
| `CRON_SECRET` | Sim (produção) | Bearer token para endpoints de cron (`/api/cron/*`) | string aleatória |
| `NEXT_PUBLIC_APP_URL` | Sim | URL base pública do app (usada em links de e-mail e webhooks) | `https://meudominio.com.br` |
| `EVOLUTION_API_URL` | Não | URL da Evolution API para WhatsApp | `http://localhost:8080` |
| `EVOLUTION_API_KEY` | Sim (produção) | API key da Evolution — webhook retorna 401 sem ela | `sua-api-key` |
| `EVOLUTION_INSTANCE` | Não | Nome da instância Evolution | `escolinha` |
| `ANTHROPIC_API_KEY` | Não | Chave da API Claude para o chatbot WhatsApp | `sk-ant-...` |
| `CLAUDE_MODEL` | Não | Modelo Claude usado pelo chatbot | `claude-sonnet-4-20250514` |
| `MERCADOPAGO_ACCESS_TOKEN` | Não | Token Mercado Pago — use `TEST-...` em dev, `APP_USR-...` em produção | `TEST-...` |
| `MERCADOPAGO_WEBHOOK_SECRET` | Não | Secret para validar webhooks do MP | string aleatória |
| `ESCOLA_CEP` / `ESCOLA_LOGRADOURO` / `ESCOLA_NUMERO` / `ESCOLA_BAIRRO` / `ESCOLA_CIDADE` / `ESCOLA_UF` | Não | Endereço da escola para emissão de boleto (fallback por responsável) | — |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Não | E-mail da service account para Google Calendar | `escolinha@projeto.iam.gserviceaccount.com` |
| `GOOGLE_PRIVATE_KEY` | Não | Chave privada da service account Google | `"-----BEGIN PRIVATE KEY-----\n..."` |
| `FPFS_SYNC_TOKEN` | Não | Token Bearer para `POST /api/sync/fpfs` | string aleatória |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Não | SMTP para e-mails de inadimplência e recuperação de senha | `smtp.gmail.com` / `587` |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_EMAIL` | Não | Chaves VAPID para push notifications PWA | — |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Não | Chave pública VAPID exposta ao cliente | — |
| `NODE_ENV` | Não | `development` ou `production` | `production` |

**Mínimo para rodar localmente:** `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `SESSION_SECRET` e `DATABASE_URL`.

---

## 4. Deploy oficial na VPS

Para as instruções do deploy oficial em VPS com Node/PM2/Caddy e o checklist de segurança, veja **`DEPLOY.md`**.

Resumo da primeira instalação:

```bash
# Na VPS Ubuntu, após clonar o repositório:
bash deploy/setup-vps.sh   # cria o .env e para para configuração
bash deploy/gen-secrets.sh # gere e copie os segredos para o .env
nano .env                  # configure domínio, banco e integrações
bash deploy/setup-vps.sh   # instala/builda/migra e inicia PM2 + Caddy
npm run db:seed-prod       # somente na primeira instalação
```

### Checklist pós-deploy obrigatório

- [ ] `SESSION_SECRET` gerado com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] `ADMIN_PASSWORD` trocada (nunca use o valor do `.env.example`)
- [ ] `CRON_SECRET` definido
- [ ] `EVOLUTION_API_KEY` definida (se usar WhatsApp)
- [ ] `MERCADOPAGO_ACCESS_TOKEN` trocado para token de produção (`APP_USR-...`)
- [ ] `DATABASE_URL=file:/var/lib/escolinha/prod.db`
- [ ] `UPLOADS_DIR` e `BACKUP_DIR` apontando para `/var/lib/escolinha`
- [ ] `NEXT_PUBLIC_APP_URL` apontando para o domínio real

---

## 5. Estrutura do Projeto

```
app/                    # Next.js App Router
  actions/              # Server Actions — toda mutação de dados passa aqui
  api/                  # API Routes (auth, webhooks, cron, upload, push)
  alunos/               # CRUD de alunos
  caixa/                # Caixa financeiro (PIX, boleto, maquininha)
  campeonatos/          # Campeonatos e FPFS
  configuracoes/        # Configurações do sistema
  frequencia/           # Registro de frequência
  responsavel/          # Portal do responsável (área separada, auth própria)
  relatorio/            # Relatórios financeiros e de alunos
  matricula/            # Pré-matrícula pública (sem auth)
  dashboard/            # Dashboard principal
  login/                # Tela de login do admin

components/            # Componentes React reutilizáveis
  dashboard/            # Widgets do dashboard (gráficos Recharts)
  layout/               # Sidebar, header, bottom nav
  responsavel/          # Componentes exclusivos do portal do responsável
  ui/                   # Componentes base shadcn/ui

lib/                   # Utilitários e lógica de negócio
  auth.ts               # requireAuth(), RBAC (admin/secretaria/tecnico)
  session.ts            # Leitura/criação de sessão via cookie HMAC
  env.ts                # Validação de variáveis de ambiente obrigatórias
  db.ts                 # Instância singleton do Prisma Client
  whatsapp/             # Evolution API, chatbot Claude, roteamento de intents
  __tests__/            # Testes unitários (Vitest)

prisma/
  schema.prisma         # Modelos de dados (Aluno, Pagamento, Responsavel, etc.)
  migrations/           # Histórico de migrations SQL
  seed.ts               # Dados de teste (não executar em produção)

scripts/
  backup.ts             # Empacota banco, uploads e configuração (mantém 30 últimos)
  restore.ts            # Valida e restaura um pacote completo
  housekeeping.ts       # Limpeza de dados antigos

e2e/                   # Testes Playwright (fluxos de ponta a ponta)
public/                # Assets estáticos (ícones, imagens, manifesto PWA)
```

### Como funciona a autenticação

Há dois sistemas de auth independentes:

1. **Admin / funcionários** — login em `/login`, sessão HMAC-SHA256 em cookie `httpOnly`. A validação verifica primeiro usuários no banco (`Usuario`), depois fallback para `ADMIN_USERNAME`/`ADMIN_PASSWORD` no env. Roles: `admin`, `secretaria`, `tecnico`.

2. **Portal do responsável** — login em `/responsavel/login`, sessão separada. O responsável é identificado por e-mail + senha (bcryptjs). Recuperação de senha via e-mail (SMTP).

As Server Actions protegidas chamam `requireAuth()` de `lib/auth.ts`, que lança erro se não houver sessão válida.

---

## 6. Operações Comuns

### Criar um novo admin (ou funcionário)

Via interface: acesse o painel admin > **Configurações > Usuários > Novo usuário**. Defina username, nome, senha e role (`admin`, `secretaria` ou `tecnico`).

Via código (útil em automações):

```ts
// Chame criarUsuario() de app/actions/usuarios.ts
import { criarUsuario } from "@/app/actions/usuarios"

await criarUsuario({
  username: "novo.admin",
  nome: "Nome Completo",
  senha: "senha-segura",
  role: "admin",
})
```

### Backup completo

```bash
# Cria backups/dev-AAAA-MM-DDTHH-MM-SS.backup (mantém os 30 mais recentes)
npm run db:backup

# Na VPS de produção
npm run db:backup
```

O `setup-vps.sh` instala o cron de snapshot local. Confirme a entrada e o log:

```bash
crontab -l
tail -n 50 logs/backup.log
```

### Ver os logs

```bash
# Aplicação na VPS
pm2 logs escolinha
sudo journalctl -u caddy -n 100 -f
```

### Restaurar um backup

```bash
# Lista os backups disponíveis
ls backups/

# Desenvolvimento, com o servidor parado
npm run db:restore -- --confirm-stopped backups/dev-2026-06-01T03-00-00.backup

# VPS, sempre dentro de uma janela de manutenção
pm2 stop escolinha
npm run db:restore -- --confirm-stopped /var/lib/escolinha/backups/prod-AAAA-MM-DD.backup
pm2 startOrReload deploy/ecosystem.config.cjs --only escolinha
pm2 save
```

### Resetar senha de um responsável

Via interface admin: **Secretaria > Responsáveis > editar responsável > Redefinir senha**.

Ou diretamente no banco via Prisma Studio:

```bash
npm run db:studio
# Abra http://localhost:5555, localize o Responsavel pelo email e atualize o campo `senha`
# Atenção: a senha precisa estar hasheada com bcrypt — use a interface do admin para evitar erro
```

### Aplicar novas migrations após atualizar o código

```bash
# Na VPS, o script cria snapshot, para o app, instala, builda, migra e reinicia.
bash deploy/deploy.sh
```

### Limpar dados antigos

```bash
npm run housekeeping
```

Remove registros obsoletos (logs, sessões expiradas, etc.) conforme a lógica em `scripts/housekeeping.ts`.
