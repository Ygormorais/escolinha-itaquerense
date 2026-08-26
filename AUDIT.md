# Auditoria visual e técnica

## Escopo

Auditoria da landing pública, autenticação, portal da família e portal administrativo,
com atenção especial ao dashboard e ao fluxo de pagamentos. O levantamento combina
inspeção do código, renderização local em desktop e mobile e análise da estrutura de
testes. Nenhum conteúdo textual ou rota foi alterado.

## Stack de estilos identificada

- Next.js 16, React 19 e TypeScript.
- Tailwind CSS 4 como sistema utilitário principal.
- shadcn/ui e Base UI nos componentes de interface.
- `class-variance-authority`, `clsx` e `tailwind-merge` para variantes e composição.
- CSS global em `app/globals.css`.
- CSS dedicado da landing em `components/landing/*.css`.
- CSS público gerado por constantes em `lib/public-css.ts`.
- Tokens também declarados em `tailwind.config.ts`, criando mais de uma fonte de verdade.
- Não há Styled Components, Emotion, Sass ou CSS Modules.

## Fontes atuais

- **Inter**: corpo, controles, navegação, tabelas e textos utilitários.
- **Playfair Display**: títulos e destaques editoriais.
- Fallbacks: Georgia e Times New Roman para títulos; `system-ui` e sans-serif para corpo.
- As fontes são carregadas por `next/font/google` em `app/layout.tsx` e expostas pelas
  variáveis `--font-inter`, `--font-playfair`, `--font-body` e `--font-heading`.

## Paleta atual

### Marca

- Vermelho principal: `#C62828`
- Vermelho escuro: `#9F1D1D`
- Vermelho profundo: `#4A0B0B`
- Vermelho institucional: `#7F0000`
- Vermelho vivo: `#E53935`
- Vermelho quente auxiliar: `#D84040`
- Vermelho suave: `#F6CACA`, `#EF9A9A`, `#FFEBEE`, `#FFF5F5`

### Neutros quentes

- Papel principal: `#FAF8F5`
- Papel secundário: `#F3EFE9`
- Superfície elevada: `#FFFCF9`
- Branco: `#FFFFFF`
- Tinta principal: `#1C1412`
- Texto secundário: `#5C534E`
- Texto discreto: `#8A827C`
- Borda: `#E8E2DA`
- Borda forte: `#D4CBC0`

### Semânticos

- Sucesso: `#0F7A5A`
- Atenção: `#A86417`
- Perigo: `#B3261E`
- Informação: `#225EA8`
- WhatsApp: `#25D366`

### Tema escuro

- Fundo: `#171312` no app e `#14110F` nas páginas públicas.
- Card: `#211A18` no app e `#1F1A18` nas páginas públicas.
- A existência de dois pares próximos, mas diferentes, já indica divergência entre
  os sistemas global e público.

## Pontos fortes atuais

- Identidade alvirrubra reconhecível e coerente com o clube.
- Combinação Inter + Playfair cria uma voz própria sem prejudicar a leitura geral.
- Landing com hierarquia editorial clara, bom uso de fotografia e chamadas de ação.
- Componentes base de botão, card, status e cabeçalho já existem e reduzem duplicação.
- Login restrito e login da família já compartilham proporções e identidade.
- Dashboard apresenta atalhos e alertas relevantes logo no início.
- Navegação administrativa separa visão geral, operação e configurações.
- Há suporte a tema escuro, redução de movimento e links para pular ao conteúdo.

## Problemas visuais identificados

### 1. Tokens fragmentados

As mesmas cores, sombras, raios e fontes aparecem em `app/globals.css`,
`tailwind.config.ts`, `components/landing/landing.css` e `lib/public-css.ts`.
Apesar de a direção ser semelhante, há diferenças como `#171312` versus `#14110F`,
além de neutros avulsos fora da paleta canônica. Isso facilita divergências futuras
entre landing, admin, autenticação e portal da família.

### 2. Escala de raios e sombras inconsistente

A landing trabalha principalmente com 10, 14 e 20 px; o sistema global deriva raios
de `0.875rem`; autenticação usa 22 e 28 px. Cards equivalentes acabam transmitindo
pesos visuais diferentes sem uma razão funcional clara.

### 3. Dashboard com alertas dominantes demais

No desktop, três alertas consecutivos ocupam grande parte da primeira dobra e repetem
a mesma estrutura. As métricas financeiras e operacionais, que deveriam apoiar a
decisão rápida, ficam abaixo. No mobile, essa sequência empurra os indicadores ainda
mais para baixo e aumenta o custo de rolagem.

### 4. Cabeçalho de ações não se adapta completamente ao mobile

No dashboard mobile, o botão de geração, as setas e o seletor de mês permanecem em uma
linha mais larga que o viewport. O texto do mês é cortado e o conteúdo sugere overflow
horizontal. O cabeçalho precisa de uma composição responsiva explícita, com ação
principal separada da navegação temporal.

### 5. Pagamentos concentra ações demais no mesmo nível

A tela combina quatro indicadores, busca, dois filtros, exportação, importação, mês de
referência, geração, notificação, total recebido, seleção em lote e até quatro ações por
linha. Tudo compete por atenção. A tabela funciona no desktop, mas a densidade visual e
o número de botões por registro dificultam escaneabilidade e adaptação para telas menores.

### 6. Hierarquia tipográfica mistura editorial e operacional

Playfair funciona bem em títulos institucionais, porém também aparece em números e
indicadores que se beneficiariam de algarismos mais neutros e alinhados. A regra de uso
entre título editorial, KPI, rótulo e dado tabular ainda não está formalizada.

### 7. Landing e aplicação parecem produtos parentes, mas separados

A paleta e as fontes aproximam as superfícies, porém landing e admin usam sistemas de
CSS, espaçamento, cabeçalho e componentes distintos. A transição visual é reconhecível,
mas ainda não parece um único sistema de produto.

### 8. Falta proteção automática para acessibilidade e regressão visual

Existem testes funcionais extensos e verificações pontuais de estilo computado, mas não
há auditoria automatizada com axe/pa11y nem snapshots visuais. Mudanças de contraste,
foco, overflow e quebra de layout podem passar mesmo com o fluxo funcional verde.

### 9. Componentes operacionais grandes demais

Alguns clientes concentram interface, estado, filtros, diálogos e regras de apresentação:

- detalhe de campeonato: 764 linhas;
- pagamentos: 680 linhas;
- avaliações: 535 linhas;
- agenda: 532 linhas;
- alunos: 517 linhas;
- inadimplência: 488 linhas.

Isso aumenta o risco de inconsistência e torna qualquer redesign mais caro. A divisão
deve seguir blocos reais da interface, não apenas separar arquivos por tamanho.

## Componentes prioritários para redesign

1. **Tokens globais e primitivas**: consolidar cor, tipografia, espaçamento, raio,
   sombra, foco e estados em uma fonte canônica.
2. **PageHeader e barra de contexto**: padronizar título, descrição, ação principal,
   seletor temporal e comportamento mobile.
3. **Alertas do dashboard**: criar resumo compacto e expansível, com severidade e
   prioridade claras.
4. **StatCard e QuickActions**: definir hierarquia de KPI, ícones, números e densidade.
5. **FilterBar**: componente responsivo para busca, filtros, período e ações secundárias.
6. **DataTable operacional**: melhorar escaneabilidade, ações por linha, seleção em lote,
   estados vazios e alternativa mobile.
7. **Pagamentos**: primeiro fluxo completo a migrar para as novas primitivas.
8. **Campeonatos**: decompor detalhe, partidas, convocações e escalação.
9. **Sidebar e BottomNav**: alinhar nomenclatura, indicadores e prioridades entre
   desktop e mobile.
10. **Landing e páginas públicas**: migrar gradualmente para os tokens canônicos sem
    alterar conteúdo ou estrutura de rotas.

## Riscos técnicos além do visual

- Cobertura total atual: 67,86% de linhas e 57,39% de branches.
- Mercado Pago, mailer, Google Calendar e roteador de IA aparecem sem cobertura direta.
- Ferramentas do WhatsApp têm cobertura baixa em relação ao impacto operacional.
- Não há vulnerabilidades de produção reportadas por `npm audit`.
- Não há issues ou pull requests abertas no GitHub no momento da auditoria.
- O deploy gratuito, HTTPS, secrets, backups e crons continuam sendo uma frente externa
  separada do redesign.

## Ordem recomendada após aprovação

1. Criar `DESIGN_SYSTEM.md` com uma direção estética única e tokens consolidados.
2. Implementar primitivas compartilhadas e testes de acessibilidade/visual.
3. Redesenhar dashboard e pagamentos em desktop e mobile.
4. Decompor campeonatos, avaliações, agenda e alunos por blocos de interface.
5. Ampliar testes das integrações críticas.
6. Migrar landing e páginas públicas para a fonte canônica de tokens.
7. Concluir a preparação de produção quando a hospedagem gratuita estiver disponível.

## Aprovação necessária

Esta auditoria encerra a Fase 1. A Fase 2 deve definir a direção estética e o design
system antes de qualquer mudança visual nos componentes.
