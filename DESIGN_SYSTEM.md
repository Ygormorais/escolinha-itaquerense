# Design System — Escolinha Itaquerense

## Direção estética

### Orgânico / Humano

A direção escolhida é **Orgânico / Humano**. Ela preserva a memória afetiva do clube,
o acolhimento das famílias e a energia do esporte sem transformar o produto em uma
interface infantil ou excessivamente decorativa.

O sistema combina:

- papel quente em vez de branco clínico;
- vermelho alvirrubro como sinal de ação, identidade e urgência;
- tinta marrom-escura para reduzir dureza visual;
- Playfair Display em momentos editoriais e institucionais;
- Inter em tarefas, números, formulários e dados;
- formas suavemente arredondadas, bordas quentes e sombras discretas;
- fotografia e escudo como elementos de identidade, não como ornamentos repetidos.

Essa direção já existe parcialmente na landing. O objetivo não é inventar outra marca,
mas transformá-la em um sistema único, previsível e adequado tanto para comunicação
quanto para operação administrativa.

## Princípios

1. **Humano antes de burocrático** — linguagem visual acolhedora sem esconder dados.
2. **Ação evidente** — cada tela deve possuir uma ação principal reconhecível.
3. **Densidade progressiva** — resumo primeiro; detalhes e ações avançadas sob demanda.
4. **Um clube, um sistema** — landing, família, autenticação e admin compartilham tokens.
5. **Mobile é operação real** — nenhuma funcionalidade depende de largura de desktop.
6. **Estado nunca depende apenas de cor** — texto, ícone e semântica acompanham a cor.
7. **Movimento com propósito** — transições ajudam orientação, sem animação ornamental.

## Arquitetura dos tokens

Os valores primitivos devem existir uma única vez em `app/globals.css`. Tailwind,
componentes e CSS público devem consumir aliases sem redeclarar os valores hexadecimais.

Camadas:

1. **Primitivos**: `--red-600`, `--warm-950`, `--paper-50`.
2. **Semânticos**: `--background`, `--foreground`, `--primary`, `--danger`.
3. **Componentes**: `--card-radius`, `--control-height`, `--sidebar-width`.

## Tokens de cor

### Marca

| Token | Valor | Uso |
|---|---:|---|
| `--brand-950` | `#4A0B0B` | rodapé, superfícies profundas, texto sobre fundo claro |
| `--brand-900` | `#7F0000` | hover forte e elementos institucionais |
| `--brand-800` | `#9F1D1D` | ação secundária e texto de marca |
| `--brand-600` | `#C62828` | ação principal, seleção e destaque |
| `--brand-500` | `#E53935` | tema escuro e realces |
| `--brand-300` | `#EF9A9A` | bordas e estados suaves |
| `--brand-200` | `#F6CACA` | fundos de alerta leve |
| `--brand-100` | `#FFEBEE` | seleção e hover |
| `--brand-50` | `#FFF5F5` | superfície de marca mínima |

### Neutros quentes

| Token | Valor | Uso |
|---|---:|---|
| `--warm-950` | `#1C1412` | texto principal |
| `--warm-700` | `#5C534E` | texto secundário |
| `--warm-500` | `#8A827C` | texto auxiliar e ícones |
| `--warm-300` | `#D4CBC0` | borda forte |
| `--warm-200` | `#E8E2DA` | borda padrão |
| `--paper-100` | `#F3EFE9` | fundo agrupado e muted |
| `--paper-50` | `#FAF8F5` | fundo da aplicação |
| `--paper-0` | `#FFFFFF` | card e popover |
| `--paper-raised` | `#FFFCF9` | navegação e superfície elevada |

### Semânticos

| Token | Base | Fundo suave | Uso |
|---|---:|---:|---|
| `--success` | `#0F7A5A` | `#EDF9F4` | pago, concluído, positivo |
| `--warning` | `#A86417` | `#FFF8ED` | atenção e prazo próximo |
| `--danger` | `#B3261E` | `#FEF1F0` | vencido, erro e destrutivo |
| `--info` | `#225EA8` | `#EFF5FD` | orientação e informação |
| `--whatsapp` | `#25D366` | `#EFFCF3` | ações exclusivas do canal |

### Tema claro

- `--background: var(--paper-50)`
- `--foreground: var(--warm-950)`
- `--card: var(--paper-0)`
- `--muted: var(--paper-100)`
- `--border: var(--warm-200)`
- `--primary: var(--brand-600)`
- `--ring: var(--brand-600)`

### Tema escuro

Um único conjunto deve substituir as duas versões atuais:

- `--background: #171312`
- `--foreground: #F8F2F0`
- `--card: #211A18`
- `--popover: #211A18`
- `--muted: #2B2321`
- `--muted-foreground: #B7A7A1`
- `--border: rgba(255,255,255,.10)`
- `--primary: #E53935`
- `--ring: #E53935`

## Tipografia

### Famílias

- `--font-heading`: Playfair Display, peso 700 ou 800.
- `--font-body`: Inter, pesos 400, 500, 600 e 700.
- Dados numéricos, moedas e tabelas usam Inter com `font-variant-numeric: tabular-nums`.

### Escala

| Papel | Mobile | Desktop | Peso | Família |
|---|---:|---:|---:|---|
| Display | 36/40 | 56/60 | 800 | Playfair |
| H1 | 30/34 | 36/40 | 800 | Playfair |
| H2 | 24/30 | 30/36 | 700 | Playfair |
| H3 | 20/26 | 22/28 | 700 | Playfair |
| KPI | 28/32 | 32/36 | 700 | Inter |
| Body large | 17/28 | 18/30 | 400 | Inter |
| Body | 15/24 | 15/24 | 400 | Inter |
| Label | 13/18 | 13/18 | 600 | Inter |
| Caption | 12/16 | 12/16 | 500 | Inter |
| Overline | 11/16 | 11/16 | 700 | Inter, uppercase |

Regras:

- Playfair fica restrita a títulos de página, seção e comunicação institucional.
- KPI, moeda, datas, tabelas e controles usam Inter.
- Overlines usam espaçamento de letras entre `0.08em` e `0.12em`.
- Texto corrido mantém largura máxima aproximada de 65 caracteres.

## Espaçamento

Escala baseada em 4 px:

| Token | Valor |
|---|---:|
| `--space-1` | 4 px |
| `--space-2` | 8 px |
| `--space-3` | 12 px |
| `--space-4` | 16 px |
| `--space-5` | 20 px |
| `--space-6` | 24 px |
| `--space-8` | 32 px |
| `--space-10` | 40 px |
| `--space-12` | 48 px |
| `--space-16` | 64 px |
| `--space-20` | 80 px |

Uso:

- controles relacionados: 8 a 12 px;
- conteúdo interno de card: 16 a 24 px;
- blocos de página: 24 a 32 px;
- seções públicas: 56 a 88 px;
- padding horizontal mobile: 16 px;
- padding horizontal do admin desktop: 32 px.

## Raios

| Token | Valor | Uso |
|---|---:|---|
| `--radius-control` | 10 px | inputs, botões e selects |
| `--radius-card` | 16 px | cards e tabelas |
| `--radius-panel` | 20 px | painéis de destaque e dialogs |
| `--radius-hero` | 24 px | composições institucionais |
| `--radius-pill` | 999 px | badges e filtros segmentados |

Raios maiores não devem ser aplicados isoladamente por página.

## Sombras

| Token | Valor | Uso |
|---|---|---|
| `--shadow-xs` | `0 1px 2px rgba(74,11,11,.05)` | controle |
| `--shadow-sm` | `0 2px 8px rgba(74,11,11,.06)` | card padrão |
| `--shadow-md` | `0 8px 28px rgba(74,11,11,.10)` | popover e card elevado |
| `--shadow-lg` | `0 24px 60px rgba(74,11,11,.12)` | dialog e hero |
| `--shadow-focus` | `0 0 0 4px rgba(198,40,40,.15)` | foco de controle |

Elevação deve indicar camada ou interatividade; não deve substituir borda em todos os cards.

## Layout responsivo

### Breakpoints de intenção

- até 479 px: celular compacto;
- 480–767 px: celular amplo;
- 768–1023 px: tablet;
- 1024–1279 px: desktop;
- 1280 px ou mais: desktop amplo.

### Regras globais

- Conteúdo do admin: largura fluida, máximo de 1600 px.
- Landing: container máximo de 1200 px.
- Nenhuma toolbar deve depender de `overflow-x` para expor a ação principal.
- Tabelas com mais de cinco colunas usam uma representação própria no mobile.
- Bottom navigation reserva espaço por `safe-area-inset-bottom`.
- Ações primárias permanecem visíveis; ações secundárias podem migrar para menu.

## Componentes

### PageHeader

- título e descrição à esquerda;
- ação principal à direita no desktop;
- no mobile, título em uma linha e contexto/ações em bloco separado;
- seletor de período nunca divide a mesma linha com uma CTA larga em 390 px;
- altura determinada pelo conteúdo, sem valores fixos.

### ContextBar

Novo padrão para período, filtros globais e ações de exportação:

- desktop: linha flexível com agrupamentos visuais;
- mobile: período na primeira linha, ação principal na segunda;
- ações raras agrupadas em “Mais ações”;
- estado atual sempre visível em texto.

### AlertSummary

- um único card-resumo na primeira dobra;
- exibe total por severidade e o alerta mais crítico;
- detalhes em lista expansível ou seção imediatamente posterior;
- perigo, atenção e informação mantêm ícone e rótulo textual;
- não usar três painéis altos consecutivos.

### StatCard

- overline curta;
- valor em Inter com números tabulares;
- comparação ou contexto em uma linha;
- ícone opcional, sem competir com o valor;
- variantes neutra, positiva, atenção e crítica.

### QuickAction

- no máximo cinco ações primárias no dashboard;
- ícone, verbo curto e área clicável mínima de 44 px;
- mobile em grade de duas colunas;
- ações secundárias permanecem na navegação contextual.

### FilterBar

- busca ocupa o espaço flexível;
- filtros usam rótulos acessíveis e largura previsível;
- filtros ativos aparecem como chips removíveis;
- botão de limpar só aparece quando necessário;
- desktop em uma linha; mobile empilhado sem corte.

### DataTable

- cabeçalho fixo apenas quando houver rolagem vertical real;
- números alinhados à direita e com algarismos tabulares;
- status em badge textual;
- ação principal visível e ações secundárias em menu;
- seleção em lote ativa uma barra contextual;
- mobile usa cards/linhas resumidas com expansão, não uma tabela comprimida;
- estados vazio, carregando, erro e sem resultado são componentes explícitos.

### Button

- alturas: 36 px compacto, 44 px padrão, 48 px destaque;
- variantes: primary, secondary, outline, ghost, destructive e link;
- apenas uma ação primary por região visual;
- ícone isolado exige `aria-label` e área mínima de 40 × 40 px.

### FormField

- label sempre visível;
- ajuda antes do erro; erro junto ao campo;
- altura padrão de 44 px;
- foco com ring de 4 px sem deslocamento do layout;
- placeholder não substitui label.

### Dialog e Sheet

- dialog para decisões curtas e formulários focados;
- sheet para navegação, detalhes e fluxos auxiliares no mobile;
- rodapé com ação principal à direita no desktop e largura total no mobile;
- confirmação destrutiva explicita objeto e consequência.

## Navegação

- Sidebar desktop mantém os três grupos atuais, com no máximo um grupo expandido por contexto.
- Item ativo usa barra vermelha, fundo suave e texto forte.
- Badges numéricos aparecem apenas quando exigem ação.
- BottomNav contém cinco destinos prioritários; o restante fica no menu.
- Nomes e ícones devem ser idênticos entre Sidebar, BottomNav e busca global.

## Acessibilidade

- contraste mínimo WCAG AA: 4,5:1 em texto e 3:1 em texto grande/elementos gráficos;
- foco visível em todos os controles por teclado;
- área de toque mínima de 44 × 44 px em mobile;
- headings em ordem lógica, com um `h1` por página;
- alerts dinâmicos usam `role="alert"` ou região `aria-live` apropriada;
- ícones decorativos usam `aria-hidden`;
- informações não dependem apenas de cor;
- animações respeitam `prefers-reduced-motion`;
- adicionar axe aos fluxos E2E principais.

## Movimento

- rápido: 120 ms para hover e press;
- padrão: 200 ms para expansão e troca de estado;
- entrada de overlay: 240 ms;
- easing padrão: `cubic-bezier(.25,.46,.45,.94)`;
- evitar animação de layout em tabelas e painéis de dados;
- skeletons podem usar pulse suave, desativado em redução de movimento.

## Iconografia e imagens

- Lucide permanece como biblioteca única de ícones de interface.
- Tamanho padrão: 16 px em controles, 20 px em navegação, 24 px em destaques.
- Escudo oficial aparece em marca, contexto institucional e adversários, sem repetição ornamental.
- Fotografias mantêm proporção definida, `object-fit: cover` e texto alternativo útil.
- Assets faltantes usam fallback neutro com nome/iniciais, nunca imagem quebrada.

## Estratégia de implementação

### Fundação

- consolidar tokens em `app/globals.css`;
- fazer Tailwind e CSS público consumirem aliases;
- alinhar Button, Card, Input, Badge e PageHeader;
- introduzir testes de contraste, axe e overflow.

### Portal administrativo

- implementar ContextBar, AlertSummary, FilterBar e DataTable;
- migrar dashboard e pagamentos primeiro;
- validar 390, 768, 1024 e 1440 px;
- decompor componentes por blocos reais da interface.

### Demais áreas

- migrar campeonatos, avaliações, agenda, alunos e inadimplência;
- alinhar Sidebar e BottomNav;
- migrar portal da família, landing e páginas públicas para os tokens canônicos;
- preservar textos e estrutura de rotas.

### Robustez

- ampliar cobertura de Mercado Pago, email, Google Calendar, WhatsApp e IA;
- automatizar snapshots visuais das páginas prioritárias;
- concluir checklist de produção, backup e crons quando houver hospedagem.

## Critérios de aceite

- nenhuma página apresenta overflow horizontal em 390 px;
- landing, autenticação, família e admin usam os mesmos tokens primitivos;
- apenas títulos editoriais usam Playfair;
- ações primárias são únicas e evidentes por região;
- tabelas possuem alternativa mobile legível;
- fluxos prioritários passam em axe sem violações críticas ou sérias;
- screenshots de referência cobrem tema claro, tema escuro, desktop e mobile;
- lint, TypeScript, unitários, E2E e build permanecem verdes;
- conteúdo textual e rotas permanecem inalterados.

## Hallmark — sistema bloqueado

- **Gênero:** playful, aplicado como acolhimento sofisticado — nunca infantil.
- **Marketing:** composição editorial institucional, preservando a arquitetura da landing.
- **Aplicação:** macroestrutura Workbench, orientada a filtros, resumo e ação.
- **Conteúdo:** leitura tipográfica direta, sem enriquecimento ornamental.
- **Movimento:** feedback de controle; sem elevação decorativa de cards.
- **Fonte de tokens:** `tokens.css`, importado por `app/globals.css`.

Todas as páginas compartilham tema, tipografia, CTA e navegação. A variação ocorre
somente pela densidade e pelos componentes necessários à tarefa.

## Exports

### CSS e Tailwind v4

`tokens.css` contém os primitivos portáteis em OKLCH. O bloco `@theme` de
`app/globals.css` mapeia esses primitivos para as utilities Tailwind já usadas pelo app.

### DTCG

```json
{
  "$schema": "https://design-tokens.github.io/community-group/format/",
  "color": {
    "paper": { "$value": "oklch(97.8% 0.009 76)", "$type": "color" },
    "ink": { "$value": "oklch(20.5% 0.015 38)", "$type": "color" },
    "accent": { "$value": "oklch(51.6% 0.197 28)", "$type": "color" }
  },
  "font": {
    "display": { "$value": "Playfair Display, Georgia, serif", "$type": "fontFamily" },
    "body": { "$value": "Inter, system-ui, sans-serif", "$type": "fontFamily" }
  },
  "space": {
    "md": { "$value": "1rem", "$type": "dimension" },
    "lg": { "$value": "1.5rem", "$type": "dimension" }
  }
}
```

### shadcn/ui

O mapeamento canônico permanece em `app/globals.css`: paper → `--background`,
paper-raised → `--card`/`--popover`, ink → `--foreground`, vermelho alvirrubro →
`--primary`/`--ring`, e os neutros quentes → `--muted`/`--border`/`--input`.
