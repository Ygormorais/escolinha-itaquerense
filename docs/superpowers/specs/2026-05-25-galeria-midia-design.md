# Galeria de Mídia — Design Spec
**Data:** 2026-05-25
**Status:** Aprovado

## Objetivo

Permitir que o admin cadastre links de vídeos (YouTube/Vimeo) e álbuns de fotos (Google Fotos, Drive, etc.) vinculados a partidas ou campeonatos. Os responsáveis visualizam esse conteúdo na aba "Galeria" do portal.

---

## Modelo de Dados

Novo model `Media` no Prisma:

```prisma
model Media {
  id           Int          @id @default(autoincrement())
  tipo         String       // "video" | "fotos"
  titulo       String
  url          String
  partidaId    Int?
  partida      Partida?     @relation(fields: [partidaId], references: [id], onDelete: Cascade)
  campeonatoId Int?
  campeonato   Campeonato?  @relation(fields: [campeonatoId], references: [id], onDelete: Cascade)
  createdAt    DateTime     @default(now())
}
```

- `Partida` recebe `media Media[]`
- `Campeonato` recebe `media Media[]`
- Exatamente um de `partidaId` ou `campeonatoId` é preenchido por registro
- `onDelete: Cascade` — ao remover a partida/campeonato, a mídia é removida automaticamente

---

## Arquitetura

| Arquivo | Ação |
|---------|------|
| `prisma/schema.prisma` | Adicionar model `Media` + relações em `Partida` e `Campeonato` |
| `prisma/migrations/` | Nova migration `add_media` |
| `app/actions/midia.ts` | Server actions: `adicionarMidia`, `removerMidia` |
| `app/configuracoes/midia/page.tsx` | Admin page — server component |
| `app/configuracoes/midia/midia-client.tsx` | Admin client — tabela + dialog de criação |
| `components/layout/sidebar.tsx` | Novo item "Mídia" em "Documentos & Config" |
| `app/responsavel/galeria/page.tsx` | Portal — aba Galeria (server component) |

---

## Admin — Página de Mídia

Rota: `/configuracoes/midia`

### Tabela

Exibe todas as mídias cadastradas com colunas:
- **Tipo** — ícone ▶ (vídeo) ou 📷 (fotos)
- **Título**
- **URL** (truncada)
- **Vinculado a** — nome da partida (ex: "Corinthians 2×1 — 20/05") ou campeonato (ex: "🏆 Camp. Paulista 2026")
- **Ações** — botão Remover

Estado vazio: "Nenhuma mídia cadastrada."

### Dialog "+ Nova Mídia"

Campos:
1. **Tipo** — select com opções "Vídeo" e "Fotos"
2. **Título** — input obrigatório (ex: "Melhores momentos", "Gol do João")
3. **URL** — input obrigatório (YouTube, Vimeo, Google Fotos, Drive, etc.)
4. **Vincular a** — radio ou select com duas opções:
   - **Partida** — dropdown com partidas ordenadas por data desc (exibe: adversário + resultado + data)
   - **Campeonato** — dropdown com campeonatos ordenados por data desc (exibe: nome)

Validação no servidor: `titulo` e `url` obrigatórios, exatamente um de `partidaId`/`campeonatoId` preenchido.

### Server Actions (`app/actions/midia.ts`)

```typescript
adicionarMidia(data: {
  tipo: "video" | "fotos"
  titulo: string
  url: string
  partidaId?: number
  campeonatoId?: number
}): Promise<{ success: true } | { error: string }>

removerMidia(id: number): Promise<{ success: true }>
```

Ambas chamam `requireAuth()` e `revalidatePath("/configuracoes/midia")`.

---

## Sidebar

Novo item em "Documentos & Config", antes de "Configurações":

```typescript
{ href: "/configuracoes/midia", label: "Mídia", icon: Film }
```

`Film` importado de `lucide-react`.

---

## Portal — Aba Galeria

Rota: `/responsavel/galeria`

### Navegação

Link "Galeria" adicionado ao portal. O portal atualmente tem links para Dashboard e Mensalidades — adicionar "Galeria" na mesma navegação.

### Conteúdo

A página busca toda a mídia cadastrada, agrupada por origem:

```
db.media.findMany({
  include: { partida: true, campeonato: true },
  orderBy: { createdAt: "desc" },
})
```

**Estrutura de exibição:**

1. **Campeonatos com mídia** — um card por campeonato com seus links de mídia + links das partidas daquele campeonato que têm mídia
2. **Partidas avulsas** (sem campeonato) — seção separada com as partidas que têm mídia mas não estão vinculadas a campeonato

**Cada link de mídia:**
- Ícone: ▶ para vídeo, 📷 para fotos
- Título do link
- Abre em nova aba (`target="_blank"`, `rel="noopener noreferrer"`)

**Estado vazio:** "Nenhuma mídia disponível ainda."

### Visibilidade

Todos os responsáveis autenticados veem toda a mídia — o conteúdo é coletivo (fotos e vídeos do time, não por aluno).

---

## Fora de Escopo

- Upload direto de arquivos de vídeo ou imagem para o servidor
- Player de vídeo embutido na página (abre no serviço externo)
- Restrição de mídia por aluno ou turma
- Ordenação manual dos links
- Notificação push para responsáveis quando nova mídia é adicionada
