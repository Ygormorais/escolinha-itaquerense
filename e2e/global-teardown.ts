import { db } from "@/lib/db"
import { RESP_TESTE } from "./test-credentials"

export default async function globalTeardown() {
  // Remove alunos criados pelos testes E2E ("E2E Aluno ..." e "E2E Aprovacao ...")
  const alunos = await db.aluno.findMany({
    where: { OR: [{ nome: { startsWith: "E2E Aluno " } }, { nome: { startsWith: "E2E Aprovacao " } }] },
    select: { id: true },
  })
  const ids = alunos.map((a) => a.id)

  if (ids.length > 0) {
    await db.pagamento.deleteMany({ where: { alunoId: { in: ids } } })
    await db.aluno.deleteMany({ where: { id: { in: ids } } })
  }

  // Remove custos criados pelos testes E2E
  await db.custo.deleteMany({ where: { descricao: { startsWith: "Custo E2E" } } })

  // Remove pré-matrículas criadas pelos testes E2E
  await db.preMatricula.deleteMany({
    where: { OR: [{ nomeAluno: { startsWith: "Teste E2E" } }, { nomeAluno: { startsWith: "E2E Aprovacao " } }] },
  })

  // Remove responsável de teste criado pelo globalSetup e os criados pelos specs (resp.<ts>@e2e.test)
  await db.responsavel.deleteMany({ where: { email: RESP_TESTE.email } })
  await db.responsavel.deleteMany({ where: { email: { endsWith: "@e2e.test" } } })

  await db.$disconnect()
}
