# AUDIT

## Escopo auditado

O projeto nao possui hoje uma landing page publica no formato marketing/site institucional. A entrada principal encontrada no App Router e:

- `app/login/page.tsx`: tela de login administrativo
- `app/responsavel/login/page.tsx`: tela de login do portal do responsavel

A rota raiz `app/page.tsx` renderiza um dashboard autenticado, nao uma homepage promocional.

## Stack de estilos identificada

- Next.js 16 com App Router
- Tailwind CSS v4
- `shadcn` para base de componentes
- CSS global centralizado em `app/globals.css`
- Tema light/dark via `next-themes`
- Tokens complementares em `tailwind.config.ts`

## Fontes atuais em uso

- `Inter`: texto corrido e interface (`--font-body`)
- `Nunito`: headings (`--font-heading`)
- Fontes carregadas via `@import` do Google Fonts em `app/globals.css`

## Paleta de cores atual

### Core brand

- `#7F0000`
- `#B71C1C`
- `#C62828`
- `#E53935`
- `#EF9A9A`
- `#FFEBEE`
- `#FFF5F5`

### Base neutra

- `#FAFAF8`
- `#FFFFFF`
- `#1A1A1A`
- `#F5F1F1`
- `#6B6363`
- `#EFE6E6`

### Semanticas

- Sucesso: `#ECFDF5`, `#047857`
- Aviso: `#FFFBEB`, `#B45309`
- Erro: `#FEF2F2`, `#B91C1C`
- Info: `#EFF6FF`, `#1D4ED8`

### Dark mode

- `#1A1214`
- `#231A1A`
- `#2E2222`
- `#3D1515`
- `#A89898`

## Arquivos-chave observados

- [app/globals.css](C:/Users/Ygor/projetos/elite/escolinha-itaquerense/app/globals.css)
- [tailwind.config.ts](C:/Users/Ygor/projetos/elite/escolinha-itaquerense/tailwind.config.ts)
- [app/layout.tsx](C:/Users/Ygor/projetos/elite/escolinha-itaquerense/app/layout.tsx)
- [app/login/page.tsx](C:/Users/Ygor/projetos/elite/escolinha-itaquerense/app/login/page.tsx)
- [app/login/login-form.tsx](C:/Users/Ygor/projetos/elite/escolinha-itaquerense/app/login/login-form.tsx)
- [app/responsavel/login/page.tsx](C:/Users/Ygor/projetos/elite/escolinha-itaquerense/app/responsavel/login/page.tsx)

## Problemas visuais identificados

### 1. Hierarquia de marca fraca

- A marca existe apenas como um simbolo generico em `app/login/page.tsx`, sem assinatura visual forte.
- Falta um momento de primeira dobra com identidade, contexto e personalidade.
- A pagina de responsavel usa outro tratamento visual, o que fragmenta a percepcao de produto.

### 2. Inconsistencia entre superficies principais

- Login administrativo usa fundo solido claro e bloco central simples.
- Login do responsavel usa gradiente azul com card padrao.
- Os dois entry points parecem produtos diferentes, embora compartilhem a mesma marca.

### 3. Sistema tipografico pouco explorado

- `Nunito` e `Inter` estao corretamente declaradas, mas a interface usa a combinacao de modo funcional, sem uma escala tipografica claramente marcante.
- Titulos, subtitulos e textos auxiliares ainda nao constroem uma narrativa visual forte.

### 4. Paleta pouco disciplinada no produto como um todo

- O tema principal e coeso em torno do vermelho, mas ha varios hex adicionais espalhados no codigo.
- O login do responsavel introduz azul no background (`to-blue-50`), o que enfraquece a consistencia da marca.
- Existem cores semanticas e utilitarias em excesso para uma identidade ainda pouco consolidada.

### 5. Layout seguro demais

- As telas de entrada seguem o padrao "card centralizado" quase sem variacao.
- Ha pouco trabalho de composicao, ritmo, contraste de massas e uso de espaco negativo.
- O resultado transmite funcionalidade, mas nao diferenciacao.

### 6. Componentes base pedem refinamento

- Bordas, sombras e raios estao definidos, mas a linguagem visual ainda parece default de biblioteca.
- Inputs, botoes e cards cumprem a funcao, porem sem assinatura premium ou memoravel.

### 7. Dark mode existe, mas nao dirige a experiencia

- Os tokens dark estao presentes em `app/globals.css`, porem as telas de entrada nao parecem desenhadas a partir dele como experiencia completa.
- A adaptacao atual parece mais tecnica do que intencional.

## Componentes que precisam de redesign prioritario

1. `app/login/page.tsx`
2. `app/login/login-form.tsx`
3. `app/responsavel/login/page.tsx`
4. Tokens globais em `app/globals.css`
5. Extensoes de tema em `tailwind.config.ts`

## Diagnostico resumido

O projeto ja tem uma boa base tecnica de design system: Tailwind v4, tokens globais, fontes definidas e componentes reutilizaveis. O problema principal nao e infraestrutura, e direcao visual. Hoje a experiencia de entrada ainda parece um conjunto de telas funcionais, nao uma marca forte e coesa.

Para a fase seguinte, a recomendacao e escolher uma unica direcao estetica e usá-la para unificar:

- identidade de marca
- escala tipografica
- composicao das telas de entrada
- linguagem de botoes, campos e cards
- consistencia entre area administrativa e portal do responsavel
