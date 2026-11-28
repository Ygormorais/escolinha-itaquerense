# Roteiro de lançamento

Uma página, na ordem em que as coisas acontecem. Os detalhes de cada comando estão em
[`deploy/README.md`](../deploy/README.md); aqui está o que fazer, quando e como saber que deu certo.

## 0. Antes de começar (reunir)

| Item | Para quê |
| --- | --- |
| IP e acesso SSH da VPS | instalar e atualizar o sistema |
| Telefone, endereço e WhatsApp reais do clube | rodapé, recibos, contato, mensagens |
| Senha forte do admin | primeiro acesso (`ADMIN_PASSWORD`) |
| Conta de e-mail SMTP | recuperação de senha e avisos |
| Ids de evento da FPFS por categoria (ou IP liberado no Cloudflare deles) | jogos e classificação automáticos |
| Texto revisado da política de privacidade (`docs/PRIVACIDADE_RASCUNHO.md`) | página `/privacidade` |

Sem a FPFS o sistema vai ao ar normalmente; só jogos e classificação ficam manuais.

## 1. Servidor

1. Criar a VPS Ubuntu (ver seção 1 de `deploy/README.md`). Instância única: o banco é SQLite em arquivo.
2. `bash deploy/setup-vps.sh` (para no `.env` na primeira vez), `bash deploy/gen-secrets.sh`, preencher o `.env`, rodar o setup de novo.
3. `npm run db:seed-prod` (só na primeira vez) para criar o admin.
4. `npm run deploy:check` até não sobrar erro.

**Pronto quando:** `curl http://IP/api/health` responde `ok`.

## 2. Endereço e HTTPS

- Sem domínio: usar `IP-COM-HIFENS.sslip.io` (por exemplo `203-0-113-10.sslip.io`) no bloco do `deploy/Caddyfile`. O Caddy emite o certificado sozinho.
- Com domínio: apontar o DNS para o IP e trocar o endereço no mesmo bloco. Depois `sudo systemctl reload caddy`.
- Ajustar `NEXT_PUBLIC_APP_URL` no `.env` para o endereço final e refazer o build (`bash deploy/deploy.sh`).

**Pronto quando:** o site abre em `https://` com cadeado e `robots.txt` e `sitemap.xml` respondem.

## 3. Primeiro acesso e conferência (20 minutos)

1. Entrar em `/login` com o admin e **trocar a senha**.
2. Em Configurações: nome, endereço, telefone, WhatsApp, redes sociais e link de avaliação do Google.
3. Cadastrar uma turma, um aluno e um responsável de teste; entrar no portal com ele (`/responsavel/login`).
4. Conferir no celular: página inicial, Turmas, Aula experimental, Partidas, portal da família.
5. Pedir a recuperação de senha de um responsável: o e-mail chega? (valida o SMTP).
6. Apagar o cadastro de teste.

## 4. Rotinas automáticas

- Backup: `deploy/install-backup-cron.sh` (instalado pelo setup). Conferir `logs/backup.log` no dia seguinte.
- FPFS: `deploy/install-fpfs-cron.sh https://SEU_ENDERECO` (se houver ids de evento).
- Ensaio de restauração: `npm run db:backup:drill` prova que o backup volta inteiro. Rodar uma vez agora e uma vez por mês.
- Cópia fora da VPS: configurar o workflow `backups.yml` (seção "Backup automático" do `DEPLOY.md`). Backup só na própria VPS não protege contra perda da VPS.
- Monitor externo em `/api/health` (UptimeRobot ou similar) com alerta no celular.

## 5. Primeira semana

- Olhar a central de **Pendências** todo dia: nota baixa na pesquisa, risco de evasão, mensalidades vencidas.
- Ler `pm2 logs escolinha --lines 200` e `logs/backup.log` no segundo e no sétimo dia.
- Só depois de uma semana de uso real avaliar ativar o CSP (hoje em Report-Only).

## 6. Se algo der errado

- Versão nova quebrou: `bash deploy/rollback.sh` (volta para a tag anterior).
- Schema novo impede a versão antiga de abrir: `pm2 stop escolinha`, `npm run db:restore -- --confirm-stopped <backup>`, subir de novo. Passos completos na seção 5 de `deploy/README.md`.
- Site fora do ar e sem causa óbvia: `pm2 status`, `pm2 logs escolinha`, `sudo systemctl status caddy`.
