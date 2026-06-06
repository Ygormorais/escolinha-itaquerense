# Radar Chart de Evolução Técnica — Spec

**Data:** 2026-06-05  
**Status:** Aprovado

## Objetivo
Responsável vê a evolução técnica do filho num gráfico radar animado com slider de datas — mostra como as notas mudaram ao longo do tempo.

## Localização
Página existente `/responsavel/desempenho` — substitui ou complementa o conteúdo atual.

## Habilidades avaliadas (já existem em `Avaliacao`)
`velocidade`, `tecnica`, `tatica`, `fisico`, `atitude`  
Escala 1–10.

## Componente `RadarEvolutionChart`

### Props
```ts
type AvaliacaoSnapshot = {
  data: Date
  label: string   // "Jun/2026"
  notas: { velocidade: number; tecnica: number; tatica: number; fisico: number; atitude: number }
}
props: { snapshots: AvaliacaoSnapshot[] }
```

### Comportamento
- Slider horizontal com uma marca por avaliação (ordenadas por data)
- Arrastar → radar anima suavemente para o snapshot da data selecionada (CSS transition)
- Botão "▶ Reproduzir" — avança automaticamente 1 snapshot/segundo
- Tooltip no radar mostra valor de cada habilidade
- Se só 1 snapshot → slider oculto, radar estático
- Se sem snapshots → `EmptyState` com ícone e mensagem

### Implementação
- `Recharts.RadarChart` + `PolarGrid` + `PolarAngleAxis` + `Radar`
- Slider: componente `Slider` do shadcn/ui (`@base-ui/react/slider`)
- Animação: estado `index` controlado, Recharts anima internamente via prop `isAnimationActive`

## Data flow
```
/responsavel/desempenho (server)
  → db.avaliacao.findMany({ where: { alunoId }, orderBy: { data: 'asc' } })
  → mapeia para AvaliacaoSnapshot[]
  → passa para <RadarEvolutionChart snapshots={...} />
```

## Página `/responsavel/desempenho` atualizada
Mantém o conteúdo existente (notas, comentários), adiciona o `RadarEvolutionChart` no topo da página.

## Fallback
Se o aluno não tem avaliações, exibe card "Avaliações ainda não realizadas — aguarde o próximo ciclo."
