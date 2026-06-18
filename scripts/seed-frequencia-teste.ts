import { db } from "@/lib/db"

// Popula frequência de teste para os alunos ativos em junho/2026.
// Idempotente (upsert na unique alunoId+data). Datas como new Date("yyyy-MM-dd")
// para casar com o que a UF grava/consulta (getFrequenciaPorTurmaData).
//   npx tsx scripts/seed-frequencia-teste.ts

const DATAS = [
  "2026-06-02", "2026-06-04", "2026-06-09",
  "2026-06-11", "2026-06-16", "2026-06-18",
]

async function main() {
  const alunos = await db.aluno.findMany({ where: { status: "Ativo" }, select: { id: true, nome: true } })
  let n = 0
  for (let ai = 0; ai < alunos.length; ai++) {
    const aluno = alunos[ai]
    for (let di = 0; di < DATAS.length; di++) {
      // padrão determinístico: maioria Presente; cada aluno falta/justifica em ~1 data
      const slot = (ai + di) % 7
      const presenca = slot === 3 ? "Ausente" : slot === 5 ? "Justificado" : "Presente"
      await db.frequencia.upsert({
        where: { alunoId_data: { alunoId: aluno.id, data: new Date(DATAS[di]) } },
        update: { presenca },
        create: { alunoId: aluno.id, data: new Date(DATAS[di]), presenca },
      })
      n++
    }
  }
  console.log(`[seed-freq] ${n} registros de frequência (${alunos.length} alunos × ${DATAS.length} datas) em junho/2026.`)
}

main()
  .catch((e) => { console.error("[seed-freq] Erro:", e); process.exit(1) })
  .then(() => process.exit(0))
