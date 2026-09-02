# Release candidate — 2026-09-01

## Escopo

- Portal restrito: autenticação por perfil, permissões, scanner de presença,
  mídia, custos, escalações, capacidade de turmas e fichas de saúde.
- Desenvolvimento: operação, treinos, famílias, inteligência local explicável,
  planejamento, pautas, resumos, objetivos, documentos e conversas.
- Operação administrativa: central de pendências, automações locais, histórico
  de ciclos, exportação e impressão.
- Portal da Família: calendário, jogos, desempenho, documentos, conversas,
  objetivos e resumos publicados.
- Operação: backup completo verificável, readiness de deploy, migrações e
  agendamentos locais.

## Decisões da versão

- A inteligência de desenvolvimento permanece local por padrão, com
  `DESENVOLVIMENTO_AI_ENABLED=false`; nenhuma API paga é necessária.
- Automações administrativas geram notificações internas e não enviam mensagens
  externas sem configuração explícita.
- O SQLite continua operando em instância única, com banco, uploads e
  configuração incluídos no backup completo.

## Evidências de homologação

- ESLint aprovado.
- TypeScript aprovado.
- 1.406 testes unitários aprovados em 170 arquivos.
- 359 testes Playwright aprovados.
- Build de produção aprovado, com 88 páginas geradas.
- 63 migrações aplicadas e banco sem duplicidades impeditivas.
- Backup completo criado e validado por manifesto, hashes e `PRAGMA quick_check`.
- Health check local retornando HTTP 200 com banco saudável.
- `npm audit` sem vulnerabilidades conhecidas após fixar versões corrigidas das
  dependências transitivas `mysql2`, `browserslist` e
  `postcss-selector-parser`.

## Pendências antes do deploy público

- Definir `FPFS_SYNC_TOKEN` real no ambiente de produção.
- Provisionar VPS, domínio e HTTPS.
- Configurar e testar a cópia externa criptografada dos backups.
- Homologar novamente os quatro perfis na URL pública.
- Manter WhatsApp, SMTP, Google Calendar e IA externa desativados enquanto não
  forem parte do serviço contratado.
