# Seed Realista + Otimização de Banco — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Popular o banco com 200 alunos realistas brasileiros, pagamentos e frequências dos últimos meses, e adicionar índices Prisma para performance.

**Architecture:** Task 1 instala a dependência e adiciona o script; Task 2 reescreve o `prisma/seed.ts` com geração programática; Task 3 adiciona índices via migration Prisma; Task 4 executa e valida tudo. Tasks 1 e 3 são independentes.

**Tech Stack:** Prisma + better-sqlite3 · @faker-js/faker · TypeScript · Next.js App Router

---

## File Map

| Arquivo | Tasks |
|---------|-------|
| `package.json` | Task 1 |
| `prisma/seed.ts` | Task 2 |
| `prisma/schema.prisma` | Task 3 |
| `prisma/migrations/*/` | Task 3 (gerada automaticamente) |

---

### Task 1: Instalar faker e adicionar script db:seed

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Instalar @faker-js/faker como devDependency**

No diretório `escolinha-itaquerense`:
```bash
npm install --save-dev @faker-js/faker
```

Saída esperada: linha com `added 1 package` ou similar. Versão mínima: 9.x.

- [ ] **Step 2: Adicionar script db:seed no package.json**

Abra `package.json` e adicione dentro de `"scripts"`:
```json
"db:seed": "npx ts-node --compiler-options \"{\\\"module\\\":\\\"CommonJS\\\"}\" prisma/seed.ts"
```

O bloco scripts deve ficar assim (mantendo os existentes):
```json
"scripts": {
  "dev": "next dev --turbopack",
  "build": "npx prisma generate && next build",
  "start": "next start",
  "lint": "next lint",
  "db:migrate": "npx prisma migrate deploy",
  "db:studio": "npx prisma studio",
  "db:seed": "npx ts-node --compiler-options \"{\\\"module\\\":\\\"CommonJS\\\"}\" prisma/seed.ts",
  "postinstall": "npx prisma generate"
}
```

- [ ] **Step 3: Verificar que faker foi instalado**

```bash
node -e "require('@faker-js/faker'); console.log('ok')"
```

Saída esperada: `ok`

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: instalar @faker-js/faker e adicionar script db:seed"
```

---

### Task 2: Reescrever prisma/seed.ts com 200 alunos realistas

**Files:**
- Modify: `prisma/seed.ts`

- [ ] **Step 1: Substituir o conteúdo de prisma/seed.ts pelo código abaixo**

Substitua **todo** o conteúdo de `prisma/seed.ts` por:

```typescript
import { PrismaClient } from "@prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import { fakerPT_BR as faker } from "@faker-js/faker"
import path from "path"

const dbPath = path.join(process.cwd(), "prisma", "dev.db")
const adapter = new PrismaBetterSqlite3({ url: dbPath })
const db = new PrismaClient({ adapter } as any)

const TURMAS = ["Sub-7", "Sub-9", "Sub-11", "Sub-13", "Sub-15", "Sub-17"] as const
const HORARIOS = [
  "Seg/Qua 08h", "Seg/Qua 10h", "Seg/Qua 14h",
  "Ter/Qui 08h", "Ter/Qui 10h", "Ter/Qui 14h",
] as const
const FORMAS = ["PIX", "PIX", "PIX", "Dinheiro", "Dinheiro", "Transferência", "Cartão"] as const

const TURMA_FAIXA: Record<string, [number, number]> = {
  "Sub-7":  [5, 7],
  "Sub-9":  [8, 9],
  "Sub-11": [10, 11],
  "Sub-13": [12, 13],
  "Sub-15": [14, 15],
  "Sub-17": [16, 17],
}

const TURMA_MENSALIDADE: Record<string, number> = {
  "Sub-7":  150,
  "Sub-9":  150,
  "Sub-11": 200,
  "Sub-13": 200,
  "Sub-15": 250,
  "Sub-17": 250,
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function getLastNMonths(n: number): string[] {
  const now = new Date()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  })
}

function getTrainingDates(horario: string): Date[] {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - 3, 1)
  const isSegQua = horario.startsWith("Seg/Qua")
  const dates: Date[] = []
  const d = new Date(start)
  while (d <= now) {
    const dow = d.getDay()
    if (isSegQua && (dow === 1 || dow === 3)) dates.push(new Date(d))
    else if (!isSegQua && (dow === 2 || dow === 4)) dates.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return dates
}

const DISTRIBUICAO = [
  { turma: "Sub-7",  ativos: 30, inativos: 3 },
  { turma: "Sub-9",  ativos: 31, inativos: 3 },
  { turma: "Sub-11", ativos: 31, inativos: 2 },
  { turma: "Sub-13", ativos: 31, inativos: 3 },
  { turma: "Sub-15", ativos: 31, inativos: 2 },
  { turma: "Sub-17", ativos: 31, inativos: 2 },
]

async function main() {
  console.log("🌱 Iniciando seed com 200 alunos realistas...")

  // Limpar na ordem de dependências
  await db.frequencia.deleteMany()
  await db.pagamento.deleteMany()
  await db.uniforme.deleteMany()
  await db.custo.deleteMany()
  await db.aluno.deleteMany()
  await db.custoRecorrente.deleteMany()
  await db.configuracao.deleteMany()
  console.log("🗑️  Tabelas limpas")

  // Definir quais índices recebem desconto (20 alunos)
  const comDesconto = new Set<number>()
  while (comDesconto.size < 20) comDesconto.add(randInt(0, 199))

  const alunosPayload: any[] = []
  let idx = 0

  for (const { turma, ativos, inativos } of DISTRIBUICAO) {
    const [minAge, maxAge] = TURMA_FAIXA[turma]
    const mensalidade = TURMA_MENSALIDADE[turma]

    for (let i = 0; i < ativos + inativos; i++) {
      const ageYears = randInt(minAge, maxAge)
      const birthYear = new Date().getFullYear() - ageYears
      const dataNascimento = new Date(birthYear, randInt(0, 11), randInt(1, 28))
      const dataMatricula = faker.date.between({
        from: new Date("2024-01-01"),
        to: new Date("2026-01-01"),
      })
      const desconto = comDesconto.has(idx) ? randInt(3, 5) * 10 : 0

      alunosPayload.push({
        nome: faker.person.fullName({ sex: "male" }),
        dataNascimento,
        turma,
        horario: pick(HORARIOS),
        responsavel: faker.person.fullName(),
        telefone: `(11) 9${randInt(1000, 9999)}-${randInt(1000, 9999)}`,
        email: faker.internet.email().toLowerCase(),
        dataMatricula,
        mensalidade,
        desconto,
        status: i < ativos ? "Ativo" : "Inativo",
        observacoes: Math.random() < 0.1 ? faker.lorem.sentence() : null,
      })
      idx++
    }
  }

  await db.aluno.createMany({ data: alunosPayload })
  const alunos = await db.aluno.findMany({ orderBy: { id: "asc" } })
  console.log(`✅ ${alunos.length} alunos inseridos`)

  // Pagamentos — últimos 6 meses
  const meses = getLastNMonths(6)
  const ativos = alunos.filter(a => a.status === "Ativo")

  const cenarios = ativos.map(() => {
    const r = Math.random()
    if (r < 0.75) return "adimplente"
    if (r < 0.90) return "inadimplente"
    return "pendente"
  })

  const pagamentosPayload: any[] = []

  for (let ai = 0; ai < ativos.length; ai++) {
    const aluno = ativos[ai]
    const cenario = cenarios[ai]
    const valorBase = aluno.mensalidade - aluno.desconto

    // Inadimplentes: 1–3 meses passados sem pagar
    const inadimplenteMeses = new Set<string>()
    if (cenario === "inadimplente") {
      const numAtrasados = randInt(1, 3)
      const mesesPassados = meses.slice(0, -1)
      for (let i = 0; i < numAtrasados && i < mesesPassados.length; i++) {
        inadimplenteMeses.add(mesesPassados[randInt(0, mesesPassados.length - 1)])
      }
    }

    for (const mes of meses) {
      const [year, month] = mes.split("-").map(Number)
      const vencimento = new Date(year, month - 1, 10)
      const isMesAtual = mes === meses[meses.length - 1]
      const isPendente = isMesAtual && cenario === "pendente"
      const isAtrasado = inadimplenteMeses.has(mes)

      let dataPagamento: Date | null = null
      let formaPagamento: string | null = null
      let valorRecebido: number | null = null

      if (!isPendente && !isAtrasado) {
        dataPagamento = new Date(year, month - 1, randInt(1, 20))
        formaPagamento = pick(FORMAS)
        valorRecebido = valorBase
      }

      pagamentosPayload.push({
        alunoId: aluno.id,
        mesReferencia: mes,
        dataVencimento: vencimento,
        dataPagamento,
        formaPagamento,
        valorRecebido,
      })
    }
  }

  await db.pagamento.createMany({ data: pagamentosPayload })
  console.log(`✅ ${pagamentosPayload.length} pagamentos inseridos`)

  // Frequências — últimos 3 meses
  const freqPayload: any[] = []

  for (const aluno of ativos) {
    const taxa = 0.60 + Math.random() * 0.35 // 60–95% por aluno
    const datas = getTrainingDates(aluno.horario)
    for (const data of datas) {
      freqPayload.push({
        alunoId: aluno.id,
        data,
        presenca: Math.random() < taxa ? "Presente" : "Ausente",
      })
    }
  }

  // Inserir em chunks de 500 (limite SQLite)
  const CHUNK = 500
  for (let i = 0; i < freqPayload.length; i += CHUNK) {
    await db.frequencia.createMany({
      data: freqPayload.slice(i, i + CHUNK),
      skipDuplicates: true,
    })
  }
  console.log(`✅ ${freqPayload.length} registros de frequência inseridos`)

  // Configurações padrão
  await db.configuracao.createMany({
    data: [
      { chave: "metaMensal",      valor: "30000" },
      { chave: "capacidadeTurma", valor: "35" },
      { chave: "nomeEscola",      valor: "Escolinha Itaquerense" },
    ],
  })
  console.log("✅ Configurações padrão criadas")
  console.log("🎉 Seed concluído!")
}

main().catch(console.error).finally(() => db.$disconnect())
```

- [ ] **Step 2: Executar o seed**

```bash
cd escolinha-itaquerense
npm run db:seed
```

Saída esperada:
```
🌱 Iniciando seed com 200 alunos realistas...
🗑️  Tabelas limpas
✅ 200 alunos inseridos
✅ 1110 pagamentos inseridos   ← (185 ativos × 6 meses)
✅ XXXX registros de frequência inseridos
✅ Configurações padrão criadas
🎉 Seed concluído!
```

Se houver erro de `module not found @faker-js/faker`, confirme que a Task 1 foi concluída.

- [ ] **Step 3: Verificar contagem**

```bash
node -e "
const { PrismaClient } = require('@prisma/client')
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3')
const path = require('path')
const adapter = new PrismaBetterSqlite3({ url: path.join(process.cwd(), 'prisma', 'dev.db') })
const db = new PrismaClient({ adapter })
db.aluno.count().then(n => { console.log('Alunos:', n); return db.pagamento.count() })
  .then(n => { console.log('Pagamentos:', n); return db.frequencia.count() })
  .then(n => { console.log('Frequencias:', n) })
  .finally(() => db.\$disconnect())
"
```

Saída esperada:
```
Alunos: 200
Pagamentos: 1110
Frequencias: (número > 5000)
```

- [ ] **Step 4: Verificar dashboard no browser**

Inicie o servidor (`npm run dev`) e acesse `/`. O dashboard deve mostrar:
- StatCard "Alunos Ativos" com valor 185
- StatCard "Inadimplentes" com valor > 0
- Gráfico de receita vs custos com barras dos últimos 6 meses
- Tabela de últimos pagamentos preenchida

- [ ] **Step 5: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: seed realista com 200 alunos, pagamentos e frequências"
```

---

### Task 3: Adicionar índices ao schema Prisma e gerar migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_add_indexes/` (gerado automaticamente)

- [ ] **Step 1: Adicionar índices no model Aluno**

No `prisma/schema.prisma`, localize `model Aluno { ... }` e adicione as linhas de `@@index` antes do fechamento `}`:

```prisma
model Aluno {
  id             Int          @id @default(autoincrement())
  nome           String
  dataNascimento DateTime
  turma          String
  horario        String
  responsavel    String
  telefone       String
  email          String
  dataMatricula  DateTime
  mensalidade    Float
  desconto       Float        @default(0)
  foto           String?
  status         String       @default("Ativo")
  observacoes    String?
  pagamentos     Pagamento[]
  frequencias    Frequencia[]
  uniformes      Uniforme[]
  whatsapp       WhatsAppMensagem[]
  transacoes     TransacaoMaquina[]
  inscricoes     InscricaoCampeonato[]
  responsavelId  Int?
  responsavelRef Responsavel?  @relation(fields: [responsavelId], references: [id])
  createdAt      DateTime     @default(now())

  @@index([status])
  @@index([turma])
  @@index([status, turma])
}
```

- [ ] **Step 2: Adicionar índices no model Pagamento**

```prisma
model Pagamento {
  id             Int               @id @default(autoincrement())
  alunoId        Int
  aluno          Aluno             @relation(fields: [alunoId], references: [id], onDelete: Cascade)
  mesReferencia  String
  dataVencimento DateTime
  dataPagamento  DateTime?
  formaPagamento String?
  valorRecebido  Float?
  observacoes    String?
  transacoes     TransacaoMaquina[]
  createdAt      DateTime          @default(now())

  @@index([alunoId])
  @@index([mesReferencia])
  @@index([dataPagamento])
  @@index([alunoId, mesReferencia])
}
```

- [ ] **Step 3: Adicionar índice no model Frequencia**

```prisma
model Frequencia {
  id        Int      @id @default(autoincrement())
  alunoId   Int
  aluno     Aluno    @relation(fields: [alunoId], references: [id], onDelete: Cascade)
  data      DateTime
  presenca  String

  @@unique([alunoId, data])
  @@index([data])
  @@index([alunoId])
}
```

- [ ] **Step 4: Adicionar índice no model Custo**

```prisma
model Custo {
  id             Int      @id @default(autoincrement())
  data           DateTime
  categoria      String
  descricao      String
  fornecedor     String
  valor          Float
  formaPagamento String
  comprovante    Boolean  @default(false)
  observacoes    String?
  createdAt      DateTime @default(now())

  @@index([data])
}
```

- [ ] **Step 5: Gerar a migration**

```bash
npx prisma migrate dev --name add_indexes
```

Saída esperada:
```
✔ Generated Prisma Client (...)
The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20260525XXXXXX_add_indexes/
    └─ migration.sql

✔ Generated Prisma Client (...)
```

Se perguntar sobre seed, responda `n` (não executar seed agora).

- [ ] **Step 6: Verificar que a migration foi criada**

```bash
ls prisma/migrations/ | tail -1
```

Deve mostrar a pasta `20260525XXXXXX_add_indexes`.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "perf: adicionar índices nas tabelas Aluno, Pagamento, Frequencia e Custo"
```

---

### Task 4: Validação final

**Files:** nenhum (só validação)

- [ ] **Step 1: Confirmar que o schema TypeScript está correto**

```bash
npx tsc --noEmit
```

Saída esperada: sem erros. Se houver erros no `seed.ts`, são type errors do faker — verifique que `@faker-js/faker` está instalado e que o import está correto (`fakerPT_BR as faker`).

- [ ] **Step 2: Abrir Prisma Studio e verificar dados**

```bash
npm run db:studio
```

Abrir no browser (porta 5555). Verificar:
- Tabela `Aluno`: 200 registros, nomes brasileiros, turmas variadas
- Tabela `Pagamento`: registros com `dataPagamento = null` para inadimplentes
- Tabela `Frequencia`: registros com "Presente" e "Ausente"

- [ ] **Step 3: Verificar dashboard completo**

Com `npm run dev` rodando, acessar:
- `/` — StatCards com números reais, gráfico de receita, aniversariantes do mês
- `/alunos` — lista com 185 ativos, filtros por turma funcionando
- `/inadimplencia` — lista de inadimplentes populada
- `/frequencia` — dados de presença dos últimos meses
