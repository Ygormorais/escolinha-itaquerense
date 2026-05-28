# DESIGN SYSTEM

## Direcao estetica escolhida

**Luxury / Refinado**

### Justificativa

Entre as opcoes do briefing, esta e a que melhor conversa com o que o produto ja tem:

- a marca ja nasce em torno de vermelhos profundos, que funcionam muito bem em uma linguagem mais refinada
- o produto precisa passar organizacao, confianca e autoridade, nao exuberancia visual
- as telas principais sao operacionais, entao a experiencia precisa parecer madura e premium sem virar uma landing barulhenta

O caminho recomendado e construir uma interface de entrada com:

- muito controle de espacamento
- contraste elegante entre tons quentes claros e vermelhos escuros
- tipografia com presenca, mas sem exagero
- componentes com acabamento mais polido que o default de biblioteca

Em resumo: menos "site generico de login", mais "marca organizada, segura e bem cuidada".

## Principios de design

1. **Autoridade calma**  
   A interface deve parecer segura e profissional sem ficar fria ou corporativa demais.

2. **Marca em primeiro plano**  
   O vermelho Itaquerense deixa de ser apenas cor de botao e passa a organizar toda a experiencia.

3. **Luxo discreto**  
   O refinamento vem de proporcao, tipografia, ritmo e materiais visuais, nao de decoracao excessiva.

4. **Consistencia entre portas de entrada**  
   Admin e portal do responsavel devem parecer partes do mesmo produto.

5. **Base tecnica reaproveitavel**  
   Os tokens precisam encaixar naturalmente em `Tailwind + shadcn`, sem exigir uma reinvencao do projeto.

## Identidade visual

### Personalidade

- acolhedora
- confiante
- tradicional sem parecer antiquada
- premium sem parecer inacessivel

### Linguagem visual

- fundos claros quentes, quase papel
- blocos brancos ou marfim com bordas suaves
- vermelho profundo como ancora de marca
- accent rosado apenas em hover, focus e superficies de apoio
- contraste alto em texto e titulos
- uso disciplinado de sombra, sempre suave e quente

## Tokens de design

### Cores

#### Brand

- `brand-950`: `#4A0B0B`
- `brand-900`: `#641111`
- `brand-800`: `#7F0000`
- `brand-700`: `#9F1D1D`
- `brand-600`: `#C62828`
- `brand-500`: `#E53935`
- `brand-200`: `#F6CACA`
- `brand-100`: `#FFEBEE`
- `brand-50`: `#FFF7F7`

#### Neutros quentes

- `ink-950`: `#171312`
- `ink-900`: `#221C1B`
- `ink-700`: `#4F4543`
- `ink-500`: `#7A6F6C`
- `ink-300`: `#CFC4C1`
- `paper-100`: `#F6F0EE`
- `paper-50`: `#FBF8F6`
- `white`: `#FFFFFF`

#### Semanticas

- `success-600`: `#0F7A5A`
- `success-50`: `#EDF9F4`
- `warning-600`: `#A86417`
- `warning-50`: `#FFF8ED`
- `danger-600`: `#B3261E`
- `danger-50`: `#FEF1F0`
- `info-600`: `#225EA8`
- `info-50`: `#EFF5FD`

### Aplicacao de cor

- **Background principal**: `paper-50`
- **Superficies elevadas**: `white`
- **Titulos**: `ink-950`
- **Texto de apoio**: `ink-700`
- **Bordas**: `#E8DEDA`
- **CTA principal**: `brand-800`
- **CTA hover**: `brand-900`
- **Estados de foco**: `brand-500` com halo translcido

### Tipografia

#### Fontes

- **Heading**: manter `Nunito`
- **Body**: manter `Inter`

Essa combinacao ja funciona e evita troca desnecessaria de fundacao. O ganho vira do uso mais intencional da escala.

#### Escala recomendada

- `display`: 48/52, `Nunito`, `800`
- `h1`: 36/42, `Nunito`, `800`
- `h2`: 28/34, `Nunito`, `700`
- `h3`: 22/28, `Nunito`, `700`
- `title`: 18/24, `Inter`, `600`
- `body-lg`: 16/26, `Inter`, `400`
- `body`: 15/24, `Inter`, `400`
- `caption`: 13/18, `Inter`, `500`

### Espacamento

Sistema base em multiplos de `4px`, com uso preferencial:

- `4`
- `8`
- `12`
- `16`
- `24`
- `32`
- `48`
- `64`
- `96`

### Raios

- `sm`: `10px`
- `md`: `14px`
- `lg`: `18px`
- `xl`: `24px`

Uso:

- inputs e botoes: `14px`
- cards e paineis principais: `18px`
- elementos hero ou blocos de destaque: `24px`

### Sombras

- `shadow-sm`: `0 1px 2px rgba(74, 11, 11, 0.05)`
- `shadow-md`: `0 10px 24px rgba(74, 11, 11, 0.08)`
- `shadow-lg`: `0 24px 60px rgba(74, 11, 11, 0.12)`

Regra: usar poucas sombras, sempre difusas, nunca "card flutuando demais".

### Bordas

- espessura padrao: `1px`
- cor padrao: `#E8DEDA`
- divisores internos: `rgba(34, 28, 27, 0.08)`

## Componentes-base

### Button

#### Primario

- fundo `brand-800`
- texto branco
- hover `brand-900`
- altura visual maior que a atual
- peso medio para forte
- sombra discreta apenas em CTA principal

#### Secundario

- fundo `white`
- borda quente clara
- texto `ink-900`
- hover com fundo `paper-100`

### Input

- altura mais generosa
- fundo branco
- borda quente suave
- placeholder menos frio
- foco com `ring` vermelho suave
- icones internos alinhados com mais respiro horizontal

### Card

- fundo `white`
- borda clara
- sombra media leve
- radius `18px`
- padding mais respirado nas telas de entrada

## Regras para telas de entrada

### Estrutura recomendada

As paginas de login devem sair do padrao "card sozinho no centro" e adotar uma composicao em duas camadas:

1. **Camada de ambiente**
   - fundo claro quente
   - textura visual sutil via gradientes quentes ou blocos tonais
   - sem orbs decorativas

2. **Camada de conteudo**
   - painel principal com marca e formulario
   - hierarquia clara entre nome da marca, subtitulo e acao

### Login administrativo

- deve transmitir controle e confianca
- pode usar uma composicao mais austera
- logo e nome da marca com mais presenca no topo
- formulario com melhor ritmo vertical

### Login do responsavel

- deve transmitir acolhimento e proximidade
- manter a mesma familia visual do admin
- diferenciar apenas no tom do subtitulo e no enquadramento, nao por trocar radicalmente a paleta

## Diretrizes de consistencia

1. Remover azuis decorativos das telas de entrada.
2. Concentrar a experiencia em neutros quentes + vermelho da marca.
3. Unificar bordas, raios e sombras entre admin e responsavel.
4. Fazer a marca parecer parte de um sistema, nao um detalhe isolado.
5. Evitar aparencia excessivamente "template shadcn".

## Prioridades de implementacao

### Prioridade 1

- `app/globals.css`
- `tailwind.config.ts`

Objetivo: consolidar tokens.

### Prioridade 2

- `app/login/page.tsx`
- `app/login/login-form.tsx`

Objetivo: criar a principal porta de entrada com assinatura visual forte.

### Prioridade 3

- `app/responsavel/login/page.tsx`

Objetivo: trazer o portal do responsavel para a mesma familia visual.

### Prioridade 4

- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/ui/card.tsx`

Objetivo: refinar os primitives para que o novo visual nao dependa de overrides demais.

## Resultado esperado

Ao final do redesign, o projeto deve comunicar:

- marca mais memoravel
- entrada mais premium e confiavel
- consistencia real entre fluxos
- acabamento visual acima do padrao de dashboard gerado

Sem trocar rotas nem conteudo textual, a experiencia ja deve parecer outro produto em maturidade.
