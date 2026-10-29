# Design System — Escolinha Itaquerense

Fonte da verdade para cor, raio, sombra, fonte e espaçamento em todo o sistema: site
público, autenticação, portal da família e admin. Valores vivem em `tokens.css`
(primitivos), `app/globals.css` (tema claro/escuro e aliases do Tailwind) e
`lib/public-css.ts` (tokens do site público). O teste `lib/__tests__/identidade-visual.test.ts`
impede a volta de fonte serifada, gradiente vermelho de fundo e cantos arredondados.

## 1. Direção estética

Identidade de clube esportivo profissional, com o site oficial do Corinthians como
referência de **lógica visual** (não de marca, layout ou conteúdo):

- **Preto e branco como base.** Superfícies brancas, seções em cinza-claro, cabeçalhos e
  barras de navegação quase pretos (`#0B0B0B`).
- **Vermelho do clube como destaque, nunca como fundo extenso.** Botões primários, selos,
  filetes, sublinhado de item ativo, chamada de matrícula. Sem gradientes vermelhos.
- **Uma família sem serifa: Raleway** em tudo. Pesada (800–900) e em caixa alta nos
  títulos de seção, no menu do site e no título das telas do admin.
- **Cantos retos** (4–8px) e sombras neutras.
- O admin e o portal herdam a mesma identidade, sem fotos grandes nem títulos gigantes em
  telas operacionais.

## 2. Cores

### 2.1 Marca

| Token | Valor | Uso |
|---|---|---|
| `brand-950` | `#4A0B0B` | uso pontual; não usar como fundo de seção |
| `brand-900` | `#7F0000` | texto vermelho escuro sobre fundo claro |
| `brand-800` / `brand-700` | `#9F1D1D` | hover de vermelho, texto de link |
| `brand-600` | `#C62828` | vermelho principal (ações, filetes, foco) |
| `brand-500` | `#E53935` | primary no tema escuro |
| `brand-300` | `#EF9A9A` | texto vermelho no tema escuro |
| `brand-200`/`100`/`50` | `#F6CACA` / `#FFEBEE` / `#FFF5F5` | fundos suaves de destaque (tema claro) |

### 2.2 Neutros — tema claro

| Token | Valor | Uso |
|---|---|---|
| `background` / `paper-50` | `#FFFFFF` | fundo de página e cartões |
| `muted` / `secondary` / `paper-100` | `#F4F4F4` | seções alternadas, fundos secundários |
| `border` / `input` | `#E5E5E5` | borda padrão |
| `foreground` / `ink-950` | `#111111` | texto principal |
| `muted-foreground` / `ink-700` | `#555555` | texto secundário |
| `sidebar` | `#0B0B0B` | sidebar e cabeçalho mobile do admin (sempre escuros) |

### 2.3 Neutros — tema escuro

| Token | Valor |
|---|---|
| `background` | `#0B0B0B` |
| `card` / `popover` | `#161616` |
| `muted` / `secondary` / `accent` | `#1F1F1F` |
| `border` / `input` | `#2A2A2A` |
| `foreground` | `#F5F5F5` |
| `muted-foreground` | `#A3A3A3` |

No tema escuro, textos `text-brand-*`, `text-danger-600`, `text-warning-*`,
`text-success-600` e `text-info-600` passam a tons claros da mesma cor, e fundos
`bg-*-50` viram tons escuros translúcidos (bloco `@layer utilities` em `app/globals.css`).
Sem isso, esses textos não atingem contraste AA sobre `#161616`.

### 2.4 Semânticos

| Token | Valor (claro) | Texto no escuro |
|---|---|---|
| `success-600` | `#0F7A5A` | `#5FD3A6` |
| `warning-600` | `#985A13` | `#F2B866` |
| `danger-600` | `#B3261E` | `#F28B82` |
| `info-600` | `#225EA8` | `#8AB4F8` |
| `whatsapp` | `#25D366` | exclusivo do botão de WhatsApp |

## 3. Raios

| Token | Valor | Site público |
|---|---|---|
| `radius-control` | `0.25rem` (4px) | `--radius-sm: 4px` |
| `radius-card` | `0.375rem` (6px) | `--radius-md: 6px` |
| `radius-panel` | `0.5rem` (8px) | `--radius-lg: 8px` |
| `radius-hero` | `0.5rem` (8px) | `--radius-xl: 8px` |
| `radius-pill` | `999px` | `999px` |

## 4. Sombras

Neutras, sem tom vermelho:

| Token | Claro | Escuro |
|---|---|---|
| `shadow-xs` | `0 1px 2px rgba(0,0,0,.06)` | — |
| `shadow-sm` | `0 1px 3px rgba(0,0,0,.08)` | `0 2px 8px rgba(0,0,0,.28)` |
| `shadow-md` | `0 6px 20px rgba(0,0,0,.10)` | `0 8px 28px rgba(0,0,0,.36)` |
| `shadow-lg` | `0 18px 48px rgba(0,0,0,.14)` | — |
| `shadow-hover` | `0 10px 28px rgba(0,0,0,.12)` | `0 10px 28px rgba(0,0,0,.4)` |
| `shadow-focus` | `0 0 0 4px` vermelho a 15% | igual |

## 5. Tipografia

- **Raleway** (`--font-raleway`, fonte variável 100–900), carregada uma única vez em
  `app/layout.tsx` (`next/font/google`), para corpo, interface e títulos.
- **Títulos:** `h1`–`h4`, títulos de seção do site (`.section-title`, `.pg-secao`,
  `.pg-hero h1`, `.hs-title`), menu principal do site e título do `PageHeader`, com peso
  800 e caixa alta onde indicado.
- **Números:** a Raleway usa algarismos de estilo antigo por padrão. O `body` força
  `font-variant-numeric: lining-nums`, e `[data-numeric]` usa `lining-nums tabular-nums`
  para valores, KPIs e tabelas.
- Aliases: `--font-heading` e `--font-body` em `app/globals.css`. Fallback sempre
  `system-ui, sans-serif` — nunca serifa.

## 6. Espaçamento

`tokens.css` já define uma escala em múltiplos de 4px e deve ser a canônica — não criar
uma nova:

| Token | rem | px |
|---|---|---|
| `space-3xs` | `0.125rem` | 2px |
| `space-2xs` | `0.25rem` | 4px |
| `space-xs` | `0.5rem` | 8px |
| `space-sm` | `0.75rem` | 12px |
| `space-md` | `1rem` | 16px |
| `space-lg` | `1.5rem` | 24px |
| `space-xl` | `2rem` | 32px |
| `space-2xl` | `3rem` | 48px |
| `space-3xl` | `4rem` | 64px |

`landing.css` e `public-css.ts` hoje usam valores de espaçamento soltos em px (`14px`,
`28px`, `36px`, `60px`...) fora dessa escala. Não é preciso migrar agora — mas qualquer
espaçamento novo ou alterado nesses arquivos deve encaixar num dos oito degraus acima
(arredondando para o mais próximo), não introduzir um nono valor.

## 7. Foco e acessibilidade

- **Anel de foco canônico:** `outline: 3px solid var(--brand-600)` (`#C62828`) com
  `outline-offset: 2px` (3px em botões/cards com borda visível). É o padrão já dominante
  em `landing.css`, `public-css.ts` e nos blocos `.auth-experience`/`.portal-familia` de
  `app/globals.css` — vira regra única, inclusive para os poucos lugares do admin que
  ainda dependem só de `--shadow-focus`.
- `--shadow-focus` (`0 0 0 4px rgba(198,40,40,.15)`) deixa de ser um mecanismo de foco
  paralelo e passa a ser **glow opcional complementar** ao `outline`, só para
  inputs/cards do admin que já o usam — nunca substituto do `outline` em elementos
  focáveis por teclado (`outline` sozinho é o que sobrevive em modo alto-contraste do
  SO; `box-shadow` não).
- **Contraste mínimo:** texto normal ≥ 4.5:1; texto grande (≥ 24px, ou ≥ 19px em negrito)
  ≥ 3:1; bordas de componente e indicador de foco ≥ 3:1 contra o fundo adjacente — WCAG
  2.2 AA. `brand-600` (`#C62828`) sobre branco (`#FFFFFF`) atende a esse mínimo de
  3:1 para uso em anel de foco e ícones; não usar `brand-600` como texto pequeno sobre
  fundos claros sem checar contraste caso a caso (prefira `brand-800`/`brand-950` para
  texto).
- `prefers-reduced-motion: reduce` já é respeitado em `landing.css`; estender a mesma
  guarda a qualquer transição nova introduzida no admin.

## 8. Como aplicar

- Valor novo de cor, raio ou sombra entra em `tokens.css` (primitivo) e é mapeado em
  `app/globals.css`; o site público consome os mesmos primitivos via `lib/public-css.ts`.
- Componentes usam as classes do Tailwind ligadas a esses tokens (`bg-background`,
  `text-muted-foreground`, `rounded-[var(--radius-card)]`, `bg-sidebar`…), nunca hex solto.
- Superfície que deve ser sempre escura (sidebar, barra do portal) usa a classe de escopo
  `dark` ou redefine os tokens públicos localmente, em vez de reescrever cada cor.
- Antes de abrir PR, `npx vitest run lib/__tests__/identidade-visual.test.ts` e o e2e
  `e2e/admin-design-system.spec.ts` (axe nos temas claro e escuro) precisam passar.
