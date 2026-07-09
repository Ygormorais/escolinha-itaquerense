/**
 * Configura campeonatos FPFS do Elite (todas as categorias) e roda sync.
 * Uso: npx tsx scripts/setup-fpfs-sync.ts
 *
 * 2026: ITAQUERENSE FUTSAL — Sub-7..10 A3 (ev. 918–921)
 * 2025: S.E. ELITE ITAQUERENSE — Sub-7..18 (ev. 863–870, 875–878)
 * 2024: SOCIEDADE ESPORTIVA ELITE… — arquivado (ev. 851–854)
 */
import { loadEnv } from "./load-env"
loadEnv()

import { db } from "../lib/db"
import { syncCampeonato } from "../lib/fpfs/sync"
import { fetchHtml, urlJogos } from "../lib/fpfs/client"
import { extractTemporadaMeta } from "../lib/fpfs/parser"

type Ev = { fpfsEventoId: number; nome: string; fpfsTimeNome: string }

/** Temporada corrente + anterior (todas as categorias com jogos na FPFS). */
const EVENTOS_ATIVOS: Ev[] = [
  // ── 2026 · iniciação A3 ──
  { fpfsEventoId: 918, nome: "FPFS 2026 · Sub-7 A3", fpfsTimeNome: "ITAQUERENSE FUTSAL" },
  { fpfsEventoId: 919, nome: "FPFS 2026 · Sub-8 A3", fpfsTimeNome: "ITAQUERENSE FUTSAL" },
  { fpfsEventoId: 920, nome: "FPFS 2026 · Sub-9 A3", fpfsTimeNome: "ITAQUERENSE FUTSAL" },
  { fpfsEventoId: 921, nome: "FPFS 2026 · Sub-10 A3", fpfsTimeNome: "ITAQUERENSE FUTSAL" },

  // ── 2025 · base completa (até haver 2026 nestas cats) ──
  { fpfsEventoId: 866, nome: "FPFS 2025 · Sub-7 A1", fpfsTimeNome: "S.E. ELITE ITAQUERENSE" },
  { fpfsEventoId: 865, nome: "FPFS 2025 · Sub-8 A1", fpfsTimeNome: "S.E. ELITE ITAQUERENSE" },
  { fpfsEventoId: 864, nome: "FPFS 2025 · Sub-9 A1", fpfsTimeNome: "S.E. ELITE ITAQUERENSE" },
  { fpfsEventoId: 863, nome: "FPFS 2025 · Sub-10 A1", fpfsTimeNome: "S.E. ELITE ITAQUERENSE" },
  { fpfsEventoId: 870, nome: "FPFS 2025 · Sub-12 A2", fpfsTimeNome: "S.E. ELITE ITAQUERENSE" },
  { fpfsEventoId: 878, nome: "FPFS 2025 · Sub-12 A1", fpfsTimeNome: "S.E. ELITE ITAQUERENSE" },
  { fpfsEventoId: 868, nome: "FPFS 2025 · Sub-14 A2", fpfsTimeNome: "S.E. ELITE ITAQUERENSE" },
  { fpfsEventoId: 876, nome: "FPFS 2025 · Sub-14 A1", fpfsTimeNome: "S.E. ELITE ITAQUERENSE" },
  { fpfsEventoId: 869, nome: "FPFS 2025 · Sub-16 A2", fpfsTimeNome: "S.E. ELITE ITAQUERENSE" },
  { fpfsEventoId: 877, nome: "FPFS 2025 · Sub-16 A1", fpfsTimeNome: "S.E. ELITE ITAQUERENSE" },
  { fpfsEventoId: 867, nome: "FPFS 2025 · Sub-18 A2", fpfsTimeNome: "S.E. ELITE ITAQUERENSE" },
  { fpfsEventoId: 875, nome: "FPFS 2025 · Sub-18 A1", fpfsTimeNome: "S.E. ELITE ITAQUERENSE" },
]

/** Temporada 2024 — só histórico, fora da vitrine. */
const EVENTOS_ARQUIVO = [851, 852, 853, 854]

async function betterName(eventoId: number, fallback: string): Promise<string> {
  try {
    const html = await fetchHtml(urlJogos(eventoId))
    const meta = extractTemporadaMeta(html)
    if (meta.categoria) {
      const div = meta.divisao ? ` ${meta.divisao}` : ""
      const ano = meta.temporada ?? ""
      return `FPFS ${ano} · ${meta.categoria}${div} · ev.${eventoId}`.slice(0, 80)
    }
  } catch {
    /* keep fallback */
  }
  return fallback
}

async function main() {
  console.log("Configurando TODAS as categorias FPFS do Elite e sincronizando...\n")

  const ativosIds = EVENTOS_ATIVOS.map((e) => e.fpfsEventoId)

  // Arquiva 2024
  const arch = await db.campeonato.updateMany({
    where: { fpfsEventoId: { in: EVENTOS_ARQUIVO } },
    data: { status: "encerrado" },
  })
  console.log(`Arquivados (2024): ${arch.count}`)

  // Reativa qualquer evento da lista ativa que estivesse encerrado
  const reativ = await db.campeonato.updateMany({
    where: { fpfsEventoId: { in: ativosIds } },
    data: { status: "andamento" },
  })
  console.log(`Reativados: ${reativ.count}`)

  for (const ev of EVENTOS_ATIVOS) {
    let camp = await db.campeonato.findFirst({ where: { fpfsEventoId: ev.fpfsEventoId } })
    const nome = await betterName(ev.fpfsEventoId, ev.nome)
    const dataInicio =
      nome.includes("2025") || ev.nome.includes("2025")
        ? new Date("2025-01-01")
        : new Date("2026-01-01")

    if (!camp) {
      camp = await db.campeonato.create({
        data: {
          nome,
          dataInicio,
          status: "andamento",
          fpfsEventoId: ev.fpfsEventoId,
          fpfsTimeNome: ev.fpfsTimeNome,
        },
      })
      console.log(`Criado #${camp.id} ${camp.nome}`)
    } else {
      await db.campeonato.update({
        where: { id: camp.id },
        data: {
          nome,
          fpfsTimeNome: ev.fpfsTimeNome,
          status: "andamento",
          dataInicio,
        },
      })
      console.log(`Atualizado #${camp.id} ${nome}`)
    }

    try {
      const resumo = await syncCampeonato(camp.id)
      console.log(
        `  Sync ${ev.fpfsEventoId}: +${resumo.jogosNovos} novos, ~${resumo.jogosAtualizados} upd, classif ${resumo.linhasClassificacao}`,
      )
    } catch (e) {
      console.error(`  Falha sync ${ev.fpfsEventoId}:`, e)
    }
  }

  // Amostra por categoria (Casa/Fora, 2025+)
  const nossos = await db.partida.findMany({
    where: {
      local: { in: ["Casa", "Fora"] },
      data: { gte: new Date("2025-01-01") },
      campeonato: { status: { not: "encerrado" } },
    },
    orderBy: { data: "desc" },
    select: {
      adversario: true,
      data: true,
      golsPro: true,
      golsContra: true,
      campeonato: { select: { nome: true } },
    },
  })

  const byCat = new Map<string, number>()
  for (const p of nossos) {
    const m = p.campeonato.nome.match(/Sub-?\d+/i)
    const cat = m ? m[0].replace(/Sub\s?/i, "Sub-") : "?"
    byCat.set(cat, (byCat.get(cat) ?? 0) + 1)
  }
  console.log("\n=== Jogos Casa/Fora por categoria (2025+) ===")
  for (const [cat, n] of [...byCat.entries()].sort((a, b) => {
    const na = Number(a[0].match(/\d+/)?.[0] ?? 99)
    const nb = Number(b[0].match(/\d+/)?.[0] ?? 99)
    return na - nb
  })) {
    console.log(`  ${cat}: ${n}`)
  }
  console.log(`Total: ${nossos.length}`)

  console.log("\n=== Últimos 10 ===")
  for (const p of nossos.slice(0, 10)) {
    console.log(
      p.data.toISOString().slice(0, 10),
      `${p.golsPro ?? "-"}-${p.golsContra ?? "-"}`,
      "vs",
      p.adversario.slice(0, 28),
      "|",
      p.campeonato.nome,
    )
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => process.exit(0))
