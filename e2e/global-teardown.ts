import { db } from "@/lib/db"
import { RESP_TESTE } from "./test-credentials"

export default async function globalTeardown() {
  // Remove alunos criados pelos testes E2E (nome começa com "E2E Aluno ")
  const alunos = await db.aluno.findMany({
    where: { nome: { startsWith: "E2E Aluno " } },
    select: { id: true },
  })
  const ids = alunos.map((a) => a.id)

  if (ids.length > 0) {
    await db.pagamento.deleteMany({ where: { alunoId: { in: ids } } })
    await db.aluno.deleteMany({ where: { id: { in: ids } } })
  }

  // Remove pré-matrículas criadas pelos testes E2E
  await db.preMatricula.deleteMany({ where: { nomeAluno: { startsWith: "Teste E2E" } } })

  // Remove responsável de teste criado pelo globalSetup
  await db.responsavel.deleteMany({ where: { email: RESP_TESTE.email } })

  await db.$disconnect()
}
