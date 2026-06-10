# Página Pública de Resultados — Spec

**Data:** 2026-06-05  
**Status:** Aprovado

## Objetivo
Rota pública `/resultados` mostrando resultados, próximos jogos, classificação e links de súmulas — sem necessidade de login.

## Rota e acesso
- `app/resultados/page.tsx` — server component, fora do `AdminShell`
- `proxy.ts` — adicionar `/resultados` à lista de rotas públicas
- Link no footer da landing page

## Layout
Mesma identidade visual da landing pública (não usa shadcn/admin shell). CSS escopado `.resultados`.

## Estrutura da página

### Header
- Logo + nome do clube + "Resultados & Classificação"
- Badge "Atualizado via FPFS" com data do último sync

### Por campeonato (um bloco por campeonato com `fpfsEventoId`)
Ordenados por `dataInicio desc` — mais recentes primeiro.

**Título do campeonato** + status (em andamento / encerrado)

**Tab 1 — Resultados recentes** (últimas 5 partidas com placar)
```
Itaquerense 3 × 1 Vila Real   Rodada 4   11/04/2026   [Ver súmula →]
```

**Tab 2 — Próximos jogos** (partidas futuras sem placar)
```
Itaquerense vs União EC   Sáb 18/04 17h   Ginásio Municipal
```

**Tab 3 — Classificação** (tabela completa da `ClassificacaoFpfs`, nossa linha em destaque)
```
# | Time          | P  | J  | V  | E  | D  | GP | GC | SG
1 | ★ Itaquerense | 12 | 4  | 4  | 0  | 0  | 14 | 3  | +11
2 | Vila Real     |  9 | 4  | 3  | 0  | 1  | 10 | 5  | +5
```

### Botão "Compartilhar no WhatsApp"
Por campeonato — `https://wa.me/?text=Veja os resultados da Escolinha Itaquerense: {url}`

### Footer
Link para o portal do responsável + link de matrícula.

## Data
```ts
db.campeonato.findMany({
  where: { fpfsEventoId: { not: null } },
  include: {
    partidas: { orderBy: { data: 'desc' }, take: 20 },
    classificacaoFpfs: { orderBy: [{ fase: 'asc' }, { posicao: 'asc' }] },
  },
  orderBy: { dataInicio: 'desc' },
})
```

## SEO
```ts
export const metadata = {
  title: "Resultados — E.C. Itaquerense",
  description: "Resultados, classificação e próximos jogos da Escolinha de Futsal E.C. Itaquerense.",
}
```

## Sem dados
Se nenhum campeonato FPFS → mensagem "Nenhum campeonato em andamento no momento."
