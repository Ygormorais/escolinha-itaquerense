# Design System — Escolinha Itaquerense

Fase 2, passo 1 (ver `AUDIT.md`). Este documento define a direção estética única e os
tokens canônicos que resolvem o achado #1 da auditoria ("Tokens fragmentados"). Ele é a
**fonte da verdade**: qualquer cor, raio, sombra, fonte ou espaçamento usado no código deve
vir daqui. Nenhum componente foi alterado ainda — isso é o mapa para a próxima tarefa.

## 1. Direção estética

Não é redesign de marca. A auditoria já elogiou a identidade **alvirrubra** (vermelho de
marca sobre neutros quentes) e a dupla **Inter + Playfair Display** como pontos fortes. A
direção é **consolidar**, não reinventar:

- Vermelho de marca (`brand-600 #C62828`) como cor de ação e destaque, nunca como fundo
  extenso.
- Papel quente (não branco puro) como base de todas as superfícies claras.
- Inter para toda interface funcional; Playfair Display reservada a títulos editoriais e
  institucionais (regra detalhada na seção 5).
- Um único conjunto de tokens de cor, raio, sombra e espaçamento, compartilhado por
  landing, autenticação, portal da família e admin. Hoje existem 5 arquivos de origem de
  tokens (`app/globals.css`, `tailwind.config.ts`, `components/landing/landing.css`,
  `lib/public-css.ts` e `tokens.css`) e eles divergem entre si. A partir deste documento,
  passam a ser **um** sistema com múltiplos pontos de entrada.

## 2. Tokens de cor

### 2.1 Marca (canônico)

| Token | Valor canônico | Uso |
|---|---|---|
| `brand-950` | `#4A0B0B` | texto sobre fundo vermelho vivo, rodapé |
| `brand-900` | `#7F0000` | gradiente de destaque (hero, membership) |
| `brand-800` | `#9F1D1D` | hover de vermelho escuro, accent-foreground |
| `brand-700` | `#9F1D1D` | **alias intencional de `brand-800`** — não existe tom próprio, manter assim |
| `brand-600` | `#C62828` | vermelho principal (ações, links, foco) |
| `brand-500` | `#E53935` | vermelho vivo (dark mode primary, hover quente) |
| `brand-300` | `#EF9A9A` | apoio suave (gráficos, bordas de destaque) |
| `brand-200` | `#F6CACA` | apoio suave (accent-foreground em dark) |
| `brand-100` | `#FFEBEE` | fundo suave (accent claro) |
| `brand-50` | `#FFF5F5` | fundo suave mais claro (accent, hover leve) |

**Divergência encontrada:** `tokens.css` define esta mesma rampa em `oklch(...)`, com
valores que **não correspondem** aos hex acima (é uma segunda tentativa de rampa, com
`brand-700` inexistente e `brand-800/900` deslocados). `tailwind.config.ts`,
`app/globals.css` (bloco `.portal-familia`/`.auth-experience`) e `landing.css`/
`public-css.ts` já concordam entre si nos valores hex acima — são maioria e viram
canônicos. **Mudança:** `tokens.css` deve parar de aproximar a rampa em `oklch` e passar a
declarar os mesmos 10 valores hex (ou `oklch(from #HEX l c h)` se precisar interpolar
tons no futuro), para que `brand-900` signifique o mesmo pixel em qualquer arquivo.

### 2.2 Neutros quentes — tema claro (canônico)

| Token | Valor | Uso |
|---|---|---|
| `paper-50` | `#FAF8F5` | fundo de página |
| `paper-100` | `#F3EFE9` | fundo secundário / seções em wash |
| `paper-raised` | `#FFFCF9` | superfície elevada (sidebar, cards sobre wash) |
| `white` | `#FFFFFF` | cards no site público, botões brancos |
| `ink-950` | `#1C1412` | texto principal |
| `ink-700` | `#5C534E` | texto secundário |
| `ink-500` | `#8A827C` | texto discreto |
| `ink-300` / `border` | `#E8E2DA` | borda padrão |
| `border-strong` | `#D4CBC0` | borda de ênfase |

Já é consistente entre `globals.css`, `landing.css` e `public-css.ts`. Nenhuma mudança de
valor — só consolidar a origem (seção 6).

### 2.3 Neutros quentes — tema escuro (canônico)

| Token | Valor canônico | Hoje diverge em |
|---|---|---|
| `bg` (fundo de página) | **`#171312`** | `landing.css`/`public-css.ts` usam `#14110F` |
| `card` / `bg-card` | **`#211A18`** | `landing.css`/`public-css.ts` usam `#1F1A18` |
| `bg-muted` / `secondary`/`muted` | **`#2B2321`** | `landing.css`/`public-css.ts` usam `#1A1614` |
| `bg-elevated` | **`#3A1717`**\* | `landing.css`/`public-css.ts` usam `#24201D`; `globals.css` não tem equivalente público, mas usa `#3A1717` como `accent` |
| `foreground` / `text` | **`#F8F2F0`** | `landing.css`/`public-css.ts` usam `#F5F0EB` |
| `muted-foreground` / `text-muted` | **`#B7A7A1`** | `landing.css`/`public-css.ts` usam `#B8AFA8` |
| `border` (dark) | **`rgba(255,255,255,0.1)`** | `landing.css`/`public-css.ts` usam `#3A332E` (cor sólida) |
| `border-strong` (dark) | **`rgba(255,255,255,0.16)`**\* | só existe hoje em `landing.css`/`public-css.ts` como `#4A423C` |

\* Onde não havia par direto, escolhido o valor mais próximo em uso (`accent` do
`globals.css`) ou uma derivação em `rgba` consistente com o padrão de borda do app.

Esta é a divergência-exemplo citada na auditoria (`#171312` vs `#14110F`). Critério de
escolha: os valores de `app/globals.css` viram canônicos porque alimentam mais telas
(admin inteiro) e já formam uma escala de contraste testada; `landing.css` e
`public-css.ts` devem passar a referenciá-los. **Mudança:** editar
`PUB_TOKENS_DARK` em `lib/public-css.ts` e o bloco `html.dark .lp` em
`components/landing/landing.css` para os valores da coluna "canônico". Bordas em `rgba`
branco (em vez de hex sólido) evitam um sexto tom de cinza flutuando fora da escala.

### 2.4 Semânticos (canônico)

| Token | Valor | Uso |
|---|---|---|
| `success-600` | `#0F7A5A` | confirmação, pagamento em dia |
| `warning-600` | `#A86417` | atenção, pendência |
| `warning-700` | tom mais escuro de `#A86417` para hover/texto sobre fundo claro | atenção (ênfase) |
| `danger-600` | `#B3261E` | erro, exclusão, inadimplência |
| `info-600` | `#225EA8` | informação neutra |
| `whatsapp` | `#25D366` | exclusivo do botão flutuante de WhatsApp — não usar como "sucesso" |

**Divergência encontrada:** dentro do próprio `app/globals.css`, o bloco `@theme` declara
`success`/`danger`/`info` como hex literal, mas `warning` é roteado por
`var(--warning-600)` vindo de `tokens.css` em `oklch` — os quatro deveriam seguir a
**mesma** estratégia. **Mudança:** `tokens.css` deve declarar `warning-50/600/700`
também em hex (iguais à tabela acima), e `globals.css` deve consumir os quatro
semânticos da mesma forma (hoje mistura hex direto com `var()`).

## 3. Escala de raio (canônico)

| Token | rem | px | Substitui |
|---|---|---|---|
| `radius-control` (sm) | `0.625rem` | 10px | `landing.css`/`public-css.ts` `--radius-sm` (já bate, sem mudança) |
| `radius-card` (md) | `1rem` | 16px | `landing.css`/`public-css.ts` `--radius-md` (hoje `14px` — **muda** para `16px`) |
| `radius-panel` (lg) | `1.25rem` | 20px | `landing.css`/`public-css.ts` `--radius-lg` (já bate, sem mudança); autenticação `22px` (**muda** para `20px`) |
| `radius-hero` (xl) | `1.5rem` | 24px | `public-css.ts` `--radius-xl` (já bate); `landing.css` não tem esse degrau — **adicionar**; autenticação `28px` (**muda** para `24px`) |
| `radius-pill` (full) | `999px` | — | já consistente em todos os arquivos |

Hoje coexistem **duas escalas de raio dentro do mesmo `app/globals.css`**: a fixa
(`radius-control/card/panel/hero/pill`, definida em `tokens.css`) e a multiplicativa do
shadcn (`--radius-sm`…`--radius-4xl`, derivada de `calc(var(--radius) * n)` com
`--radius: 0.875rem`) — essa segunda escala é a fonte do "sistema global deriva raios de
`0.875rem`" citado na auditoria, e não bate com a escala fixa acima. **Mudança:**
eliminar a derivação por `calc()` e apontar cada alias do shadcn direto para a escala
fixa: `--radius-sm → var(--radius-control)`, `--radius-md → var(--radius-card)`,
`--radius-lg → var(--radius-panel)`, `--radius-xl → --radius-2xl → --radius-3xl →
--radius-4xl → var(--radius-hero)` (nenhum componente hoje precisa de um raio maior que
o hero). Remover também a declaração solta `--radius: 0.875rem` e a duplicata de
`--radius-control` em `app/globals.css` `:root` (já existe em `tokens.css`).

## 4. Escala de sombra (canônico)

| Token | Valor (claro) | Valor (escuro) | Uso |
|---|---|---|---|
| `shadow-xs` | `0 1px 2px rgba(74,11,11,.05)` | igual | inputs, divisores, elevação mínima |
| `shadow-sm` | `0 2px 8px rgba(74,11,11,.06)` | `0 2px 8px rgba(0,0,0,.28)` | cards em repouso |
| `shadow-md` | `0 8px 28px rgba(74,11,11,.10)` | `0 8px 28px rgba(0,0,0,.36)` | cards elevados, dropdowns, popovers |
| `shadow-lg` | `0 24px 60px rgba(74,11,11,.12)` | mesma, opacidade preta equivalente | modais, lightbox, overlays grandes |
| `shadow-hover` | `0 14px 40px rgba(198,40,40,.16)` | `0 14px 40px rgba(198,40,40,.28)` | elevação em hover de cards/CTAs (tingido de marca, não neutro) |
| `shadow-focus` | `0 0 0 4px rgba(198,40,40,.15)` | igual | glow opcional sob o anel de foco (ver seção 7) |

`shadow-sm`/`shadow-md` já são idênticos entre `globals.css`, `landing.css` e
`public-css.ts` — manter. **Mudanças:** promover `shadow-hover` (hoje só em
`landing.css`/`public-css.ts`) para dentro de `app/globals.css`/`tokens.css`; adicionar
`shadow-lg` e `shadow-focus` a `landing.css`/`public-css.ts` (hoje ausentes lá); adicionar
overrides de `.dark` para `shadow-sm`/`shadow-md`/`shadow-hover` em `app/globals.css`
(hoje o admin não reescurece sombra nenhuma no tema escuro, só o público faz isso);
trocar a sombra ad hoc de `.lp .lb-inner img` (`0 20px 60px rgba(0,0,0,.45)`) por
`shadow-lg`.

## 5. Regra tipográfica: Playfair vs. Inter

- **Playfair Display** — só para títulos editoriais/institucionais: `h1`–`h4` de página,
  títulos de seção da landing (`.section-title`), hero, nomes de clube/marca em destaque,
  citações de depoimento (texto de prosa, não dado).
- **Inter** — tudo o mais, sem exceção: corpo de texto, controles, navegação, tabelas,
  rótulos, **e todo número/KPI/dado tabular**, com `font-variant-numeric: tabular-nums`.
- **Achado concreto da fuga:** `components/landing/landing.css`, seletor
  `.lp .marcos-item strong` (os números de marcos — "anos", "alunos" etc. na landing),
  usa `var(--font-heading)` (Playfair). É exatamente o vazamento que a auditoria aponta.
  **Mudança:** trocar para `var(--font-body)` + `font-variant-numeric: tabular-nums`,
  mantendo peso 800 e `letter-spacing` atual para preservar o impacto visual sem herdar a
  leitura editorial.
- O app já tem o padrão certo em `app/globals.css`: seletor `[data-numeric]` força Inter +
  `tabular-nums`. **Adotar esse mesmo atributo/convenção em `landing.css` e
  `public-css.ts`** para qualquer número futuro, em vez de reinventar a regra por
  componente.

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
  2.2 AA. `brand-600` (`#C62828`) sobre `paper-50` (`#FAF8F5`) atende a esse mínimo de
  3:1 para uso em anel de foco e ícones; não usar `brand-600` como texto pequeno sobre
  fundos claros sem checar contraste caso a caso (prefira `brand-800`/`brand-950` para
  texto).
- `prefers-reduced-motion: reduce` já é respeitado em `landing.css`; estender a mesma
  guarda a qualquer transição nova introduzida no admin.

## 8. Como aplicar

Este documento não migra código — define a fonte da verdade para a próxima tarefa. Os
quatro arquivos que hoje declaram tokens devem passar a **importar/referenciar** os
valores acima em vez de redeclará-los cada um à sua maneira:

1. **`tokens.css`** vira a única origem de valores brutos (hex, rem, easing, `oklch`
   quando fizer sentido) — cor de marca, neutros, semânticos, raio e espaçamento.
2. **`app/globals.css`** só deve mapear `tokens.css` para os slots do shadcn/Tailwind
   (`--color-*`, `--radius-*`, `--shadow-*`, `--background`, `--card`, etc.) — sem
   hex literal solto nem escala de raio paralela.
3. **`tailwind.config.ts`** deve apontar `brand`/`ink`/`paper` para os mesmos valores de
   `tokens.css` (hoje já bate em hex; é só formalizar a origem única para não
   divergir de novo).
4. **`components/landing/landing.css`** e **`lib/public-css.ts`** devem consumir os
   mesmos valores canônicos de cor, raio e sombra (claro e escuro) em vez de manter uma
   cópia própria — inclusive as correções listadas nas seções 2–4 (`bg`/`card`/`radius-md`
   escuros, `shadow-hover`/`shadow-lg`/`shadow-focus` ausentes, número da `.marcos-item`
   em Playfair).
5. Telas de autenticação com raio solto em `22px`/`28px` (fora do escopo desta tarefa,
   não estavam entre os 4 arquivos revisados) devem migrar para `radius-panel`/
   `radius-hero` na mesma passada.

Nenhuma mudança de código foi feita nesta tarefa — só este documento.
