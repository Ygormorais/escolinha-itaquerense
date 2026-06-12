import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { extrairCategorias, calcularViradas } from "@/lib/categorias"
import { CategoriasClient } from "./categorias-client"

export const metadata = { title: "Virada de categoria — Escolinha Itaquerense" }

export default async function CategoriasPage() {
  const alunos = await db.aluno.findMany({
    where: { status: "Ativo" },
    select: { id: true, nome: true, dataNascimento: true, turma: true },
    orderBy: { nome: "asc" },
  })
  const anoRef = new Date().getFullYear()
  const categorias = extrairCategorias(alunos.map((a) => a.turma))
  const viradas = calcularViradas(alunos, anoRef, categorias)

  // Serialize Date → ISO string for the client boundary
  const viradasSerializadas = viradas.map((v) => ({
    ...v,
    dataNascimento: v.dataNascimento.toISOString(),
  }))

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Virada de categoria"
        description={`Categorias propostas pela idade que o aluno completa em ${anoRef}`}
      />
      <CategoriasClient viradas={viradasSerializadas} anoRef={anoRef} />
    </div>
  )
}
