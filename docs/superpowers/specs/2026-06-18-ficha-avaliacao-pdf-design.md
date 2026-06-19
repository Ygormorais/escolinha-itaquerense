# Ficha de Avaliação em PDF

**Data:** 2026-06-18
**Status:** Aprovado

## Contexto

O portal do responsável já exibe avaliações na página `/responsavel/boletim`. Esta entrega adiciona a geração de uma ficha de avaliação imprimível (PDF via `window.print()`) para uma avaliação específica de um aluno, seguindo o padrão da declaração anual já existente no projeto.

Padrão de referência: `app/responsavel/declaracao/page.tsx` + `components/declaracao/declaracao-anual-doc.tsx` + `components/ui/print-button.tsx`.

---

## Arquitetura

Sem novas dependências. Usa o mesmo fluxo da declaração:

1. Link "Imprimir ficha" no card da avaliação → abre `/responsavel/boletim/pdf?alunoId=X&periodo=Y` em nova aba
2. Rota renderiza HTML formatado para impressão
3. `PrintButton` dispara `window.print()` → browser salva como PDF

---

## Arquivos

### Novos

**`lib/ficha-avaliacao.ts`**

Tipo e helper que monta os dados da ficha:

```ts
import { db } from "@/lib/db"

export type DadosFichaAvaliacao = {
  aluno: { nome: string; turma: string; responsavel: string }
  avaliacao: {
    periodo: string
    notaTecnica: number | null
    notaFisica: number | null
    notaComportamento: number | null
    media: number | null
    frequencia: number | null
    observacoes: string | null
  }
  clube: { nome: string; cidade: string }
}

export function calcularMedia(
  notaTecnica: number | null,
  notaFisica: number | null,
  notaComportamento: number | null
): number | null {
  const notas = [notaTecnica, notaFisica, notaComportamento].filter((n): n is number => n !== null)
  if (notas.length === 0) return null
  return Math.round((notas.reduce((a, b) => a + b, 0) / notas.length) * 10) / 10
}

export async function buscarDadosFicha(
  alunoId: number,
  periodo: string,
  responsavelId: number
): Promise<DadosFichaAvaliacao | null>
// Retorna null se aluno não pertencer ao responsavelId ou avaliação não existir
```

**`components/boletim/ficha-avaliacao-doc.tsx`**

Componente React puro (sem estado, sem "use client") que renderiza o layout A4 imprimível:

- Cabeçalho: nome do clube (negrito), título "Ficha de Avaliação"
- Identificação: nome do aluno, turma, período
- Grid 2×2 de notas: Técnica | Física | Comportamento | Média — cada célula mostra o valor com cor (≥7 verde, ≥5 amarelo, <5 vermelho, nulo "—")
- Frequência: percentual numérico + barra colorida (mesmas regras de cor do boletim)
- Observações: bloco de texto em itálico, só renderiza se `observacoes` não for nulo
- Rodapé: "Documento gerado em DD/MM/AAAA" | linha de assinatura "Treinador responsável"
- Classes Tailwind: `print:p-0`, `print:shadow-none`, `max-w-2xl mx-auto bg-white text-black`

**`app/responsavel/boletim/pdf/page.tsx`**

Rota servidor:

```ts
// searchParams: { alunoId?: string; periodo?: string }
// 1. getResponsavelSession() → redirect se não autenticado
// 2. Valida alunoId (inteiro > 0) e periodo (string não vazia) → notFound()
// 3. buscarDadosFicha(alunoId, periodo, session.responsavelId!) → notFound() se null
// 4. Renderiza:
//    <div className="p-6">
//      <div className="mb-4 print:hidden"><PrintButton /></div>
//      <FichaAvaliacaoDoc dados={dados} />
//    </div>
```

### Modificados

**`app/responsavel/boletim/page.tsx`**

Dentro do `map` de `aluno.avaliacoes`, adicionar link no `CardHeader` de cada avaliação:

```tsx
import Link from "next/link"
import { Printer } from "lucide-react"
// ...
// No CardHeader, ao lado do título do período:
<Link
  href={`/responsavel/boletim/pdf?alunoId=${aluno.id}&periodo=${av.periodo}`}
  target="_blank"
  className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
>
  <Printer className="size-3.5" />
  Imprimir ficha
</Link>
```

---

## Segurança

`buscarDadosFicha` valida `aluno.responsavelId === responsavelId` antes de retornar dados. Se não bater, retorna `null` → rota chama `notFound()`. Mesmo padrão da declaração.

---

## Testes

- **Unit (vitest):** `lib/__tests__/ficha-avaliacao.test.ts`
  - `calcularMedia`: média de 3 notas, média com 1 nota nula, todas nulas → null, arredondamento correto (ex: 7+8+9 → 8.0, não 8.000)
- **E2E (playwright):** `e2e/ficha-avaliacao-pdf.spec.ts`
  - Login como responsável, navegar até `/responsavel/boletim`, verificar link "Imprimir ficha" presente (skip se sem avaliações), navegar até a URL `/responsavel/boletim/pdf?alunoId=X&periodo=Y` e verificar que o `PrintButton` e o nome do aluno estão visíveis

---

## Fora de escopo

- PDF com múltiplos períodos numa página só
- Geração pelo admin (apenas portal do responsável)
- Upload/armazenamento do PDF gerado
- Logo visual do clube (só texto por ora)
