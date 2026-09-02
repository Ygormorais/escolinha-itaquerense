"use server"

import { z } from "zod"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

type Resultado = { id: string; titulo: string; detalhe: string; href: string }

export async function buscarOperacaoLocal(pergunta: string) {
  await requireAuth(["admin", "tecnico"])
  const parsed = z.string().trim().min(3).max(240).safeParse(pergunta)
  if (!parsed.success) return { error: "Escreva uma busca com pelo menos 3 caracteres." }
  const q = parsed.data.toLocaleLowerCase("pt-BR")
  const resultados: Resultado[] = []
  const criterios: string[] = []

  if (/falt|frequ|presen/.test(q)) {
    criterios.push("frequência registrada nos últimos 30 dias")
    const inicio = new Date(Date.now() - 30 * 86400000)
    const alunos = await db.aluno.findMany({ where: { status: "Ativo" }, select: { id: true, nome: true, turma: true, frequencias: { where: { data: { gte: inicio } }, select: { presenca: true } } }, take: 200 })
    for (const aluno of alunos) {
      const validos = aluno.frequencias.filter((item) => ["Presente", "Ausente", "Justificado"].includes(item.presenca))
      const presentes = validos.filter((item) => item.presenca === "Presente").length
      const percentual = validos.length ? Math.round(presentes / validos.length * 100) : null
      if (percentual == null || percentual < 70) resultados.push({ id: `freq-${aluno.id}`, titulo: `${aluno.nome} · ${aluno.turma}`, detalhe: percentual == null ? "Sem registros válidos em 30 dias." : `${percentual}% de presença em ${validos.length} registro(s).`, href: `/alunos/${aluno.id}` })
    }
  }
  if (/document|aceit|termo/.test(q)) {
    criterios.push("versões vigentes e aceites registrados")
    const documentos = await db.documentoInstitucional.findMany({ where: { ativo: true }, select: { id: true, titulo: true, versoes: { orderBy: { publicadoEm: "desc" }, take: 1, select: { versao: true, obrigatorio: true, _count: { select: { aceites: true } } } } }, take: 30 })
    for (const doc of documentos) { const versao = doc.versoes[0]; if (versao) resultados.push({ id: `doc-${doc.id}`, titulo: doc.titulo, detalhe: `Versão ${versao.versao} · ${versao._count.aceites} aceite(s)${versao.obrigatorio ? " · obrigatório" : ""}.`, href: "/configuracoes/documentos" }) }
  }
  if (/objetiv|famil/.test(q)) {
    criterios.push("objetivos compartilhados ainda abertos")
    const objetivos = await db.objetivoCompartilhado.findMany({ where: { status: { in: ["proposto", "combinado", "revisao_solicitada"] } }, include: { aluno: { select: { nome: true, turma: true } } }, orderBy: { updatedAt: "desc" }, take: 30 })
    for (const item of objetivos) resultados.push({ id: `obj-${item.id}`, titulo: `${item.aluno.nome} · ${item.titulo}`, detalhe: `${item.aluno.turma} · ${item.status.replaceAll("_", " ")}.`, href: "/desenvolvimento#objetivos-familia" })
  }
  if (/rotin|penden|tarefa/.test(q)) {
    criterios.push("rotinas operacionais pendentes")
    const ocorrencias = await db.rotinaOcorrencia.findMany({ where: { status: "pendente" }, include: { rotina: { select: { titulo: true, categoria: true } } }, orderBy: { vencimento: "asc" }, take: 30 })
    for (const item of ocorrencias) resultados.push({ id: `rot-${item.id}`, titulo: item.rotina.titulo, detalhe: `${item.rotina.categoria} · vencimento ${item.vencimento.toLocaleDateString("pt-BR")}.`, href: "/desenvolvimento#rotinas-operacionais" })
  }
  if (/vaga|espera|lotad|capacidade/.test(q)) {
    criterios.push("ocupação atual e lista de espera")
    const [turmas, contagens] = await Promise.all([db.configuracaoTurma.findMany({ where: { ativa: true }, include: { _count: { select: { listaEspera: { where: { status: { in: ["aguardando", "contatado"] } } } } } } }), db.aluno.groupBy({ by: ["turma"], where: { status: "Ativo" }, _count: { _all: true } })])
    const ocupacao = new Map(contagens.map((item) => [item.turma, item._count._all]))
    for (const turma of turmas) resultados.push({ id: `turma-${turma.id}`, titulo: turma.nome, detalhe: `${ocupacao.get(turma.nome) ?? 0}/${turma.capacidade} vagas · ${turma._count.listaEspera} na espera.`, href: "/turmas#capacidade-turmas" })
  }
  if (criterios.length === 0) {
    criterios.push("busca nominal em atletas ativos")
    const alunos = await db.aluno.findMany({ where: { status: "Ativo", nome: { contains: parsed.data } }, select: { id: true, nome: true, turma: true }, take: 30 })
    for (const aluno of alunos) resultados.push({ id: `aluno-${aluno.id}`, titulo: aluno.nome, detalhe: aluno.turma, href: `/alunos/${aluno.id}` })
  }
  return { dados: { pergunta: parsed.data, criterios, resultados: resultados.slice(0, 50), consultadoEm: new Date().toISOString(), aviso: "Busca local por palavras-chave e regras explícitas. Não usa IA externa, não faz diagnóstico e pode exigir refinamento manual." } }
}
