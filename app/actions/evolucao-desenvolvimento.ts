"use server"

import { z } from "zod"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { inicioDaSemana } from "@/lib/desenvolvimento"

const filtroTurmaSchema = z.object({ turma: z.string().max(100).optional() })
const comparativoSchema = z.object({ periodoDias: z.union([z.literal(30), z.literal(60), z.literal(90)]) })
const evolucaoColetivaSchema = z.object({
  turma: z.string().trim().min(1).max(100),
  meses: z.union([z.literal(6), z.literal(12)]),
})

export async function consultarAtividadeSemanalComissao(input: { turma?: string } = {}) {
  await requireAuth(["admin", "tecnico"])
  const parsed = filtroTurmaSchema.safeParse(input)
  if (!parsed.success) return { error: "Turma inválida." }

  const cicloInicio = inicioDaSemana(new Date())
  const inicio = new Date(`${cicloInicio}T00:00:00Z`)
  const fim = new Date(inicio.getTime() + 7 * 86400000)
  const turmaAluno = parsed.data.turma === undefined ? {} : { turma: parsed.data.turma }
  const turmaPlano = parsed.data.turma === undefined ? {} : { turma: parsed.data.turma }
  const [usuarios, acoes, planos, pautas] = await Promise.all([
    db.usuario.findMany({ where: { ativo: true }, select: { username: true, nome: true, role: true }, orderBy: { nome: "asc" } }),
    db.acaoDesenvolvimento.findMany({ where: { insightKey: { endsWith: `:${cicloInicio}` }, aluno: turmaAluno }, select: { usuario: true, status: true } }),
    db.planoTreino.findMany({ where: { ...turmaPlano, createdAt: { gte: inicio, lt: fim } }, select: { usuario: true, retornos: { select: { id: true }, take: 1 } } }),
    db.pautaSemanal.findMany({ where: { cicloInicio, ...turmaPlano }, select: { usuario: true } }),
  ])

  const nomes = new Map(usuarios.map((item) => [item.username, item.nome]))
  const autores = new Set<string>([
    ...usuarios.filter((item) => item.role === "tecnico").map((item) => item.username),
    ...acoes.flatMap((item) => item.usuario ? [item.usuario] : []),
    ...planos.map((item) => item.usuario),
    ...pautas.map((item) => item.usuario),
  ])
  const integrantes = [...autores].map((usuario) => ({
    usuario,
    nome: nomes.get(usuario) ?? usuario,
    acoes: {
      pendentes: acoes.filter((item) => item.usuario === usuario && item.status === "pendente").length,
      concluidas: acoes.filter((item) => item.usuario === usuario && item.status === "concluida").length,
      ignoradas: acoes.filter((item) => item.usuario === usuario && item.status === "ignorada").length,
    },
    planos: planos.filter((item) => item.usuario === usuario).length,
    planosComRetorno: planos.filter((item) => item.usuario === usuario && item.retornos.length > 0).length,
    pautas: pautas.filter((item) => item.usuario === usuario).length,
  })).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
  const semAutoria = acoes.filter((item) => !item.usuario).length

  return { dados: { cicloInicio, cicloFim: new Date(fim.getTime() - 86400000).toISOString().slice(0, 10), consultadoEm: new Date().toISOString(), integrantes, semAutoria } }
}

type RegistroAluno = {
  turma: string
  dataNascimento: Date
  frequencias: { presenca: string }[]
  avaliacoes: { id: number }[]
  acoesDesenvolvimento: { status: string }[]
}

function idadeEm(dataNascimento: Date, referencia: Date) {
  let idade = referencia.getUTCFullYear() - dataNascimento.getUTCFullYear()
  const antesDoAniversario = referencia.getUTCMonth() < dataNascimento.getUTCMonth()
    || (referencia.getUTCMonth() === dataNascimento.getUTCMonth() && referencia.getUTCDate() < dataNascimento.getUTCDate())
  if (antesDoAniversario) idade -= 1
  return idade
}

function faixaEtaria(dataNascimento: Date, referencia: Date) {
  const idade = idadeEm(dataNascimento, referencia)
  if (idade >= 6 && idade <= 8) return "6–8"
  if (idade >= 9 && idade <= 11) return "9–11"
  if (idade >= 12 && idade <= 15) return "12–15"
  if (idade >= 16 && idade <= 17) return "16–17"
  return "Fora das faixas"
}

function resumirGrupo(nome: string, alunos: RegistroAluno[]) {
  const frequencias = alunos.flatMap((item) => item.frequencias)
  const presentes = frequencias.filter((item) => item.presenca === "Presente").length
  const ausentes = frequencias.filter((item) => item.presenca === "Ausente").length
  const justificados = frequencias.filter((item) => item.presenca === "Justificado").length
  const validos = presentes + ausentes + justificados
  const acoes = alunos.flatMap((item) => item.acoesDesenvolvimento)
  return {
    nome,
    atletas: alunos.length,
    avaliados: alunos.filter((item) => item.avaliacoes.length > 0).length,
    frequencia: { presentes, ausentes, justificados, validos, percentualPresenca: validos ? Math.round(presentes / validos * 1000) / 10 : null },
    acoes: {
      pendentes: acoes.filter((item) => item.status === "pendente").length,
      concluidas: acoes.filter((item) => item.status === "concluida").length,
      ignoradas: acoes.filter((item) => item.status === "ignorada").length,
    },
  }
}

export async function consultarComparativoDesenvolvimento(input: { periodoDias: 30 | 60 | 90 }) {
  await requireAuth(["admin", "tecnico"])
  const parsed = comparativoSchema.safeParse(input)
  if (!parsed.success) return { error: "Período inválido." }

  const agora = new Date()
  const inicio = new Date(agora.getTime() - parsed.data.periodoDias * 86400000)
  const [alunos, planos] = await Promise.all([
    db.aluno.findMany({
      where: { status: "Ativo" },
      select: {
        turma: true,
        dataNascimento: true,
        frequencias: { where: { data: { gte: inicio, lte: agora } }, select: { presenca: true } },
        avaliacoes: { where: { createdAt: { gte: inicio, lte: agora } }, select: { id: true }, take: 1 },
        acoesDesenvolvimento: { where: { createdAt: { gte: inicio, lte: agora } }, select: { status: true } },
      },
      orderBy: [{ turma: "asc" }, { id: "asc" }],
    }),
    db.planoTreino.findMany({ where: { createdAt: { gte: inicio, lte: agora } }, select: { turma: true, retornos: { select: { id: true }, take: 1 } } }),
  ])

  const turmas = [...new Set(alunos.map((item) => item.turma))].sort((a, b) => a.localeCompare(b, "pt-BR"))
  const porTurma = turmas.map((turma) => ({
    ...resumirGrupo(turma || "Sem turma", alunos.filter((item) => item.turma === turma)),
    planos: planos.filter((item) => item.turma === turma).length,
    planosComRetorno: planos.filter((item) => item.turma === turma && item.retornos.length > 0).length,
  }))
  const ordemFaixas = ["6–8", "9–11", "12–15", "16–17", "Fora das faixas"]
  const porFaixa = ordemFaixas.map((faixa) => resumirGrupo(faixa, alunos.filter((item) => faixaEtaria(item.dataNascimento, agora) === faixa))).filter((item) => item.atletas > 0)

  return { dados: { periodoDias: parsed.data.periodoDias, inicio: inicio.toISOString(), fim: agora.toISOString(), consultadoEm: agora.toISOString(), porTurma, porFaixa } }
}

function chaveMes(data: Date) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`
}

function media(valores: Array<number | null>) {
  const validos = valores.filter((valor): valor is number => valor != null && Number.isFinite(valor))
  return validos.length >= 3 ? Math.round(validos.reduce((total, valor) => total + valor, 0) / validos.length * 10) / 10 : null
}

export async function consultarEvolucaoColetiva(input: { turma: string; meses: 6 | 12 }) {
  await requireAuth(["admin", "tecnico"])
  const parsed = evolucaoColetivaSchema.safeParse(input)
  if (!parsed.success) return { error: "Selecione uma turma e um período válidos." }

  const agora = new Date()
  const inicio = new Date(agora.getFullYear(), agora.getMonth() - parsed.data.meses + 1, 1)
  const alunos = await db.aluno.findMany({
    where: { status: "Ativo", turma: parsed.data.turma },
    select: {
      id: true,
      frequencias: {
        where: { data: { gte: inicio, lte: agora } },
        select: { data: true, presenca: true },
      },
      avaliacoes: {
        select: { periodo: true, notaTecnica: true, notaFisica: true, notaComportamento: true },
        orderBy: { periodo: "asc" },
      },
    },
    orderBy: { id: "asc" },
  })

  const meses = Array.from({ length: parsed.data.meses }, (_, indice) => {
    const data = new Date(agora.getFullYear(), agora.getMonth() - parsed.data.meses + 1 + indice, 1)
    const key = chaveMes(data)
    const registros = alunos.flatMap((aluno) => aluno.frequencias.filter((item) => chaveMes(item.data) === key))
    const atletasComRegistro = alunos.filter((aluno) => aluno.frequencias.some((item) => chaveMes(item.data) === key)).length
    const presentes = registros.filter((item) => item.presenca === "Presente").length
    const validos = registros.filter((item) => ["Presente", "Ausente", "Justificado"].includes(item.presenca)).length
    return {
      key,
      label: data.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", ""),
      atletasComRegistro,
      registrosValidos: validos,
      percentualPresenca: validos > 0 ? Math.round(presentes / validos * 1000) / 10 : null,
    }
  })

  const periodos = [...new Set(alunos.flatMap((aluno) => aluno.avaliacoes.map((item) => item.periodo)))].sort().slice(-6)
  const avaliacoes = periodos.map((periodo) => {
    const registros = alunos.flatMap((aluno) => aluno.avaliacoes.filter((item) => item.periodo === periodo))
    const atletasAvaliados = alunos.filter((aluno) => aluno.avaliacoes.some((item) => item.periodo === periodo)).length
    return {
      periodo,
      atletasAvaliados,
      tecnica: media(registros.map((item) => item.notaTecnica)),
      fisica: media(registros.map((item) => item.notaFisica)),
      comportamento: media(registros.map((item) => item.notaComportamento)),
    }
  })

  const percentuais = meses.flatMap((item) => item.percentualPresenca == null ? [] : [item.percentualPresenca])
  const variacaoPresenca = percentuais.length >= 2
    ? Math.round((percentuais.at(-1)! - percentuais[0]) * 10) / 10
    : null

  return {
    dados: {
      turma: parsed.data.turma,
      mesesSolicitados: parsed.data.meses,
      atletasAtivos: alunos.length,
      inicio: inicio.toISOString(),
      fim: agora.toISOString(),
      consultadoEm: agora.toISOString(),
      frequenciaMensal: meses,
      avaliacoesPorPeriodo: avaliacoes,
      variacaoPresenca,
      regraPrivacidade: "Médias de avaliação são exibidas somente quando ao menos três atletas possuem nota no critério e período.",
    },
  }
}

export async function consultarSugestoesLocaisTreino(input: { turma: string }) {
  await requireAuth(["admin", "tecnico"])
  const parsed = z.object({ turma: z.string().trim().min(1).max(100) }).safeParse(input)
  if (!parsed.success) return { error: "Selecione uma turma válida." }

  const agora = new Date()
  const inicio30 = new Date(agora.getTime() - 30 * 86400000)
  const inicio90 = new Date(agora.getTime() - 90 * 86400000)
  const [alunos, planos, planosComRetorno] = await Promise.all([
    db.aluno.findMany({ where: { status: "Ativo", turma: parsed.data.turma }, select: {
      frequencias: { where: { data: { gte: inicio30, lte: agora } }, select: { presenca: true } },
      avaliacoes: { where: { createdAt: { gte: inicio90, lte: agora } }, select: { id: true }, take: 1 },
      acoesDesenvolvimento: { where: { status: "pendente" }, select: { id: true } },
    } }),
    db.planoTreino.count({ where: { turma: parsed.data.turma } }),
    db.planoTreino.count({ where: { turma: parsed.data.turma, retornos: { some: {} } } }),
  ])
  const frequencias = alunos.flatMap((item) => item.frequencias)
  const presentes = frequencias.filter((item) => item.presenca === "Presente").length
  const ausentes = frequencias.filter((item) => item.presenca === "Ausente").length
  const justificados = frequencias.filter((item) => item.presenca === "Justificado").length
  const validos = presentes + ausentes + justificados
  const percentual = validos ? Math.round(presentes / validos * 1000) / 10 : null
  const avaliados = alunos.filter((item) => item.avaliacoes.length > 0).length
  const pendentes = alunos.reduce((total, item) => total + item.acoesDesenvolvimento.length, 0)
  const semRetorno = planos - planosComRetorno
  const sugestoes: { id: string; titulo: string; evidencia: string; sugestao: string }[] = []

  if (alunos.length === 0) sugestoes.push({ id: "sem-atletas", titulo: "Conferir composição da turma", evidencia: "Nenhum atleta ativo foi encontrado nesta turma.", sugestao: "Revise o cadastro antes de preparar atividades a partir dos registros." })
  else {
    if (percentual === null) sugestoes.push({ id: "sem-frequencia", titulo: "Registrar presença antes de adaptar por frequência", evidencia: "Não há registros válidos de frequência nos últimos 30 dias.", sugestao: "Use um plano geral revisado pela comissão e complete os registros antes de inferir necessidade de adaptação." })
    else if (percentual < 60) sugestoes.push({ id: "participacao", titulo: "Priorizar acolhimento e participação", evidencia: `${presentes} presença(s) em ${validos} registro(s) válido(s) nos últimos 30 dias (${percentual.toLocaleString("pt-BR")}% registrados).`, sugestao: "Prefira atividades simples, com rodízios curtos e participação frequente; confirme o contexto com a comissão antes do treino." })
    if (avaliados < Math.ceil(alunos.length / 2)) sugestoes.push({ id: "observacao", titulo: "Reservar um bloco de observação", evidencia: `${avaliados} de ${alunos.length} atleta(s) têm avaliação cadastrada nos últimos 90 dias.`, sugestao: "Inclua observação coletiva com critérios já usados pela escolinha, sem gerar nota automática ou ranking." })
    if (pendentes >= 3) sugestoes.push({ id: "acoes", titulo: "Concentrar o encontro em poucos acompanhamentos", evidencia: `${pendentes} ação(ões) permanecem pendentes para atletas desta turma.`, sugestao: "Escolha uma ou duas ações viáveis para observar no encontro e registre o resultado depois." })
    if (semRetorno > 0) sugestoes.push({ id: "retornos", titulo: "Fechar o ciclo dos planos anteriores", evidencia: `${semRetorno} de ${planos} plano(s) salvo(s) ainda não têm retorno da comissão.`, sugestao: "Antes de ampliar o catálogo, registre como os planos anteriores foram utilizados e quais adaptações ocorreram." })
    if (sugestoes.length === 0) sugestoes.push({ id: "continuidade", titulo: "Manter continuidade e registrar retorno", evidencia: "Os critérios locais não identificaram lacunas operacionais relevantes neste recorte.", sugestao: "Mantenha o planejamento da comissão, observe a participação do grupo e registre o retorno após o encontro." })
  }
  return { dados: { turma: parsed.data.turma, consultadoEm: agora.toISOString(), criterios: { atletasAtivos: alunos.length, frequenciaValida30Dias: validos, percentualPresenca: percentual, avaliados90Dias: avaliados, acoesPendentes: pendentes, planosSemRetorno: semRetorno }, sugestoes } }
}
