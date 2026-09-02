import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { PortalHero } from "@/components/responsavel/portal-hero"
import { DocumentosFamilia } from "./documentos-client"

export const metadata = { title: "Documentos — Portal da Família" }

export default async function DocumentosFamiliaPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated || session.responsavelId == null) redirect("/responsavel/login")
  const [alunos, documentos] = await Promise.all([
    db.aluno.findMany({ where: { responsavelId: session.responsavelId, status: "Ativo" }, select: { id: true, nome: true, turma: true }, orderBy: { nome: "asc" } }),
    db.documentoInstitucional.findMany({
      where: { ativo: true },
      select: { id: true, titulo: true, categoria: true, versoes: { orderBy: [{ publicadoEm: "desc" }, { id: "desc" }], take: 1, select: { id: true, versao: true, conteudo: true, url: true, turmas: true, obrigatorio: true, publicadoEm: true, aceites: { where: { responsavelId: session.responsavelId }, select: { alunoId: true, aceitoEm: true } } } } },
      orderBy: { titulo: "asc" },
    }),
  ])
  const itens = documentos.flatMap((documento) => {
    const versao = documento.versoes[0]
    if (!versao) return []
    const turmas = versao.turmas.split(",").map((item) => item.trim())
    return alunos.filter((aluno) => turmas.includes("Todas") || turmas.includes(aluno.turma)).map((aluno) => ({
      documentoId: documento.id,
      titulo: documento.titulo,
      categoria: documento.categoria,
      versaoId: versao.id,
      versao: versao.versao,
      conteudo: versao.conteudo,
      url: versao.url,
      obrigatorio: versao.obrigatorio,
      publicadoEm: versao.publicadoEm,
      aluno,
      aceite: versao.aceites.find((item) => item.alunoId === aluno.id)?.aceitoEm ?? null,
    }))
  })
  return <div className="flex flex-col gap-8"><PortalHero backHref="/responsavel" title="Documentos" description="Consulte a versão vigente de cada documento e registre o aceite quando solicitado." stats={[{ label: "Disponíveis", value: itens.length }, { label: "Pendentes", value: itens.filter((item) => item.obrigatorio && !item.aceite).length }]} /><DocumentosFamilia itens={itens} /></div>
}
