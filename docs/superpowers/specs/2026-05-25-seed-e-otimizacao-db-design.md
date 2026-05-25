# Seed Realista + Otimização de Banco — Design

## Objetivo

Popular o banco SQLite com ~200 alunos realistas para demonstração e adicionar índices Prisma para garantir performance à medida que o volume cresce.

## Escopo

Duas partes independentes:

1. **Seed expandido** — substituir o seed de 8 alunos por um seed de 200 alunos com dados realistas em português brasileiro
2. **Otimização** — nova migration Prisma adicionando índices nas tabelas mais consultadas

---

## Parte 1 — Seed Realista

### Dependência

`@faker-js/faker` instalada como devDependency. Usar locale `pt_BR` para nomes, telefones e emails.

### Volume e distribuição

| Turma   | Ativos | Inativos | Total |
|---------|--------|----------|-------|
| Sub-7   | 30     | 3        | 33    |
| Sub-9   | 31     | 3        | 34    |
| Sub-11  | 31     | 2        | 33    |
| Sub-13  | 31     | 3        | 34    |
| Sub-15  | 31     | 2        | 33    |
| Sub-17  | 31     | 2        | 33    |
| **Total** | **185** | **15** | **200** |

### Dados por aluno

| Campo | Regra |
|-------|-------|
| `nome` | Nome masculino completo faker pt_BR |
| `dataNascimento` | Idade coerente com turma (Sub-7 = 6–7 anos, etc.) |
| `turma` | Conforme distribuição acima |
| `horario` | Um dos 6 HORARIOS, distribuído uniformemente |
| `responsavel` | Nome completo faker pt_BR |
| `telefone` | `(11) 9XXXX-XXXX` formatado |
| `email` | email faker pt_BR |
| `dataMatricula` | Data aleatória entre 2024-01-01 e 2026-01-01 |
| `mensalidade` | Sub-7/9: R$ 150; Sub-11/13: R$ 200; Sub-15/17: R$ 250 |
| `desconto` | 20 alunos aleatórios recebem R$ 30–50 de desconto |
| `status` | `"Ativo"` ou `"Inativo"` conforme distribuição |
| `observacoes` | `null` para a maioria, texto curto faker para ~10% |

### Pagamentos

Gerados para os últimos **6 meses** (mês corrente inclusive) para todos os alunos ativos no período.

| Cenário | % dos alunos | Regra |
|---------|-------------|-------|
| Adimplente | 75% | `dataPagamento` preenchida em todos os meses anteriores |
| Inadimplente | 15% | `dataPagamento = null` em 1–3 meses passados |
| Mês corrente pendente | 10% | `dataPagamento = null` apenas no mês atual |

- `valorRecebido` = `mensalidade - desconto` para pagamentos realizados
- `formaPagamento`: PIX 50%, Dinheiro 25%, Transferência 15%, Cartão 10%
- `dataVencimento`: dia 10 do mês de referência
- `dataPagamento`: entre dia 1 e dia 20 do mês (quando preenchida)

### Frequências

Geradas para os últimos **3 meses**, cobrindo todos os dias de treino (Seg/Qua ou Ter/Qui conforme horário do aluno).

- Taxa de presença por aluno: distribuição entre 60% e 95% (variada por aluno, fixa por aluno ao longo do período)
- `presenca`: `"Presente"` ou `"Ausente"`
- Respeita a constraint única `(alunoId, data)` do schema

### Script

Arquivo: `prisma/seed.ts` (substitui o existente)

Fluxo:
1. Limpar tabelas na ordem: `frequencia`, `pagamento`, `uniforme`, `custo`, `aluno`, `custoRecorrente`, `configuracao`
2. Recriar configurações padrão (metaMensal, capacidadeTurma, etc.)
3. Inserir 200 alunos em batch
4. Inserir pagamentos em batch por mês
5. Inserir frequências em batch por mês

Adicionar script no `package.json`:
```json
"db:seed": "npx ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts"
```

---

## Parte 2 — Otimização com Índices

### Migration

Nova migration Prisma adicionando os índices abaixo no `schema.prisma`:

```prisma
model Aluno {
  // ... campos existentes ...
  @@index([status])
  @@index([turma])
  @@index([status, turma])
}

model Pagamento {
  // ... campos existentes ...
  @@index([mesReferencia])
  @@index([dataPagamento])
  @@index([alunoId])
  @@index([alunoId, mesReferencia])
}

model Frequencia {
  // ... campos existentes ...
  @@index([data])
  // @@unique([alunoId, data]) já existe
}

model Custo {
  // ... campos existentes ...
  @@index([data])
}
```

Gerar com: `npx prisma migrate dev --name add_indexes`

---

## Critérios de Sucesso

- `npx ts-node prisma/seed.ts` (ou `npm run db:seed`) conclui sem erros
- Banco tem exatamente 200 alunos após seed
- Dashboard carrega com dados realistas: receita do mês, inadimplentes, aniversariantes
- `npx prisma migrate dev` aplica a migration de índices sem conflito
- `npx prisma studio` mostra dados bem distribuídos por turma
