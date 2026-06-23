/**
 * Verificação de integridade pré-deploy.
 * Roda ANTES de `prisma migrate deploy` em produção.
 * Detecta problemas que fariam as migrations falharem.
 *
 * Uso:
 *   NODE_ENV=production DATABASE_URL=file:./caminho/prod.db npx tsx scripts/check-pre-deploy.ts
 */
import { db } from "../lib/db"

type CheckResult = { ok: boolean; label: string; detail?: string }

async function main() {
  const results: CheckResult[] = []

  // ── 1. Duplicatas em Pagamento(alunoId, mesReferencia) ────────────────────
  // Migration 20260617: adiciona UNIQUE INDEX. Falha se houver dupes.
  const dupPag = await db.$queryRaw<{ alunoId: number; mesReferencia: string; cnt: bigint }[]>`
    SELECT "alunoId", "mesReferencia", COUNT(*) as cnt
    FROM "Pagamento"
    GROUP BY "alunoId", "mesReferencia"
    HAVING COUNT(*) > 1
  `
  if (dupPag.length === 0) {
    results.push({ ok: true, label: "Pagamento: sem duplicatas (alunoId, mesReferencia)" })
  } else {
    results.push({
      ok: false,
      label: `Pagamento: ${dupPag.length} combinação(ões) duplicada(s)`,
      detail: dupPag.map((r) => `  alunoId=${r.alunoId} mes=${r.mesReferencia} (${r.cnt}x)`).join("\n"),
    })
  }

  // ── 2. Duplicatas em Responsavel.email ────────────────────────────────────
  const dupEmail = await db.$queryRaw<{ email: string; cnt: bigint }[]>`
    SELECT "email", COUNT(*) as cnt
    FROM "Responsavel"
    GROUP BY "email"
    HAVING COUNT(*) > 1
  `
  if (dupEmail.length === 0) {
    results.push({ ok: true, label: "Responsavel: sem emails duplicados" })
  } else {
    results.push({
      ok: false,
      label: `Responsavel: ${dupEmail.length} email(s) duplicado(s)`,
      detail: dupEmail.map((r) => `  email=${r.email} (${r.cnt}x)`).join("\n"),
    })
  }

  // ── 3. Duplicatas em Responsavel.cpf ─────────────────────────────────────
  const dupCpf = await db.$queryRaw<{ cpf: string; cnt: bigint }[]>`
    SELECT "cpf", COUNT(*) as cnt
    FROM "Responsavel"
    WHERE "cpf" IS NOT NULL
    GROUP BY "cpf"
    HAVING COUNT(*) > 1
  `
  if (dupCpf.length === 0) {
    results.push({ ok: true, label: "Responsavel: sem CPFs duplicados" })
  } else {
    results.push({
      ok: false,
      label: `Responsavel: ${dupCpf.length} CPF(s) duplicado(s)`,
      detail: dupCpf.map((r) => `  cpf=${r.cpf} (${r.cnt}x)`).join("\n"),
    })
  }

  // ── 4. Duplicatas em Avaliacao(alunoId, periodo) ─────────────────────────
  const dupAval = await db.$queryRaw<{ alunoId: number; periodo: string; cnt: bigint }[]>`
    SELECT "alunoId", "periodo", COUNT(*) as cnt
    FROM "Avaliacao"
    GROUP BY "alunoId", "periodo"
    HAVING COUNT(*) > 1
  `
  if (dupAval.length === 0) {
    results.push({ ok: true, label: "Avaliacao: sem duplicatas (alunoId, periodo)" })
  } else {
    results.push({
      ok: false,
      label: `Avaliacao: ${dupAval.length} combinação(ões) duplicada(s)`,
      detail: dupAval.map((r) => `  alunoId=${r.alunoId} periodo=${r.periodo} (${r.cnt}x)`).join("\n"),
    })
  }

  // ── 5. Duplicatas em Frequencia(alunoId, data) ───────────────────────────
  const dupFreq = await db.$queryRaw<{ alunoId: number; data: string; cnt: bigint }[]>`
    SELECT "alunoId", "data", COUNT(*) as cnt
    FROM "Frequencia"
    GROUP BY "alunoId", "data"
    HAVING COUNT(*) > 1
  `
  if (dupFreq.length === 0) {
    results.push({ ok: true, label: "Frequencia: sem duplicatas (alunoId, data)" })
  } else {
    results.push({
      ok: false,
      label: `Frequencia: ${dupFreq.length} combinação(ões) duplicada(s)`,
      detail: dupFreq.map((r) => `  alunoId=${r.alunoId} data=${r.data} (${r.cnt}x)`).join("\n"),
    })
  }

  // ── Relatório ─────────────────────────────────────────────────────────────
  console.log("\n=== Verificação pré-deploy ===\n")
  let hasErrors = false
  for (const r of results) {
    const icon = r.ok ? "✅" : "❌"
    console.log(`${icon}  ${r.label}`)
    if (r.detail) { console.log(r.detail); hasErrors = true }
  }

  if (hasErrors) {
    console.log("\n⚠️  Corrija os problemas acima ANTES de rodar `prisma migrate deploy`.")
    console.log("   Para remover duplicatas de pagamento, execute:")
    console.log("   DELETE FROM Pagamento WHERE id NOT IN (SELECT MIN(id) FROM Pagamento GROUP BY alunoId, mesReferencia)")
    process.exit(1)
  } else {
    console.log("\n✅  Tudo OK — pode prosseguir com o deploy.")
    process.exit(0)
  }
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
