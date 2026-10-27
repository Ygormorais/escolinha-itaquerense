import { differenceInDays, format } from "date-fns"
import { plural, sanitizeCSVCell } from "@/lib/utils"

export type Pagamento = {
  id: number
  mesReferencia: string
  dataVencimento: Date
  externalId: string | null
  statusCobranca: string | null
  canalPrevisto: string | null
}

export type Inadimplente = {
  alunoId: number
  nome: string
  turma: string
  telefone: string
  mensalidade: number
  pagamentos: Pagamento[]
}

export type FiltrosInadimplencia = { search: string; turma: string; nivel: string }

export const FORMAS = ["Pix", "Dinheiro", "Cartão de Débito", "Cartão de Crédito", "Transferência"]

/** Atraso acima disso (em dias, contado do vencimento mais antigo) vira "Crítico". */
export const LIMITE_CRITICO_DIAS = 30

export function resumirInadimplente(a: Inadimplente, agora: Date = new Date()) {
  const maisAntigo = a.pagamentos[0]?.dataVencimento ?? agora
  const diasAtraso = differenceInDays(agora, maisAntigo)
  return {
    maisAntigo,
    diasAtraso,
    isCritico: diasAtraso > LIMITE_CRITICO_DIAS,
    valorAberto: a.mensalidade * a.pagamentos.length,
  }
}

export function turmasDosInadimplentes(inadimplentes: Inadimplente[]) {
  return [...new Set(inadimplentes.map((a) => a.turma))].sort()
}

export function filtrarInadimplentes(
  inadimplentes: Inadimplente[],
  { search, turma, nivel }: FiltrosInadimplencia,
  agora: Date = new Date(),
) {
  return inadimplentes.filter((a) => {
    const matchSearch = !search || a.nome.toLowerCase().includes(search.toLowerCase())
    const matchTurma = turma === "Todas" || a.turma === turma
    if (!matchSearch || !matchTurma) return false
    if (nivel === "Todos") return true
    const { isCritico } = resumirInadimplente(a, agora)
    return nivel === "Crítico" ? isCritico : !isCritico
  })
}

export function gerarCSVInadimplentes(inadimplentes: Inadimplente[]) {
  const linhas = [
    ["Nome", "Turma", "Telefone", "Meses em Aberto", "Valor em Aberto (R$)", "Vencimento Mais Antigo"],
    ...inadimplentes.map((a) => [
      a.nome,
      a.turma,
      a.telefone,
      String(a.pagamentos.length),
      (a.mensalidade * a.pagamentos.length).toFixed(2),
      a.pagamentos[0] ? format(a.pagamentos[0].dataVencimento, "dd/MM/yyyy") : "",
    ]),
  ]
  return linhas.map((l) => l.map(sanitizeCSVCell).join(";")).join("\n")
}

export function gerarLinkWA(a: Inadimplente, nomeClube: string, template?: string) {
  let texto: string
  if (template) {
    const nome = a.nome.split(" ")[0]
    const linhasMeses = a.pagamentos.map((p) => `• ${p.mesReferencia}`).join("\n")
    const total = (a.mensalidade * a.pagamentos.length).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    texto = template
      .replace("{responsavel}", nome)
      .replace("{aluno}", a.nome)
      .replace("{meses}", linhasMeses)
      .replace("{total}", total)
      .replace("{pix}", "")
  } else {
    texto = `Olá ${a.nome.split(" ")[0]}, tudo bem? 😊\n\nPassando para avisar que identificamos ${plural(a.pagamentos.length, "mensalidade", "mensalidades", "nenhuma")} em aberto na ${nomeClube}.\n\nPoderia nos contatar para regularizar? Obrigado! 🙏`
  }
  return `https://wa.me/55${a.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(texto)}`
}
