import { describe, expect, it } from "vitest"
import {
  filtrarInadimplentes,
  gerarCSVInadimplentes,
  gerarLinkWA,
  LIMITE_CRITICO_DIAS,
  resumirInadimplente,
  turmasDosInadimplentes,
  type Inadimplente,
} from "@/app/inadimplencia/inadimplencia-utils"

const agora = new Date(2026, 9, 20, 12, 0, 0)
const diasAtras = (n: number) => new Date(2026, 9, 20 - n, 12, 0, 0)

function aluno(parcial: Partial<Inadimplente> & { dias?: number; meses?: number } = {}): Inadimplente {
  const { dias = 10, meses = 1, ...resto } = parcial
  return {
    alunoId: 1,
    nome: "Ana Souza",
    turma: "Sub-9",
    telefone: "(11) 91234-5678",
    mensalidade: 150,
    pagamentos: Array.from({ length: meses }, (_, i) => ({
      id: i + 1,
      mesReferencia: `2026-${String(9 - i).padStart(2, "0")}`,
      dataVencimento: diasAtras(dias - i * 30),
      externalId: null,
      statusCobranca: null,
      canalPrevisto: null,
    })),
    ...resto,
  }
}

describe("resumirInadimplente", () => {
  it("calcula atraso a partir do vencimento mais antigo e o valor em aberto", () => {
    const r = resumirInadimplente(aluno({ dias: 40, meses: 2 }), agora)
    expect(r.diasAtraso).toBe(40)
    expect(r.valorAberto).toBe(300)
    expect(r.maisAntigo).toEqual(diasAtras(40))
  })

  it("é crítico só acima do limite", () => {
    expect(resumirInadimplente(aluno({ dias: LIMITE_CRITICO_DIAS }), agora).isCritico).toBe(false)
    expect(resumirInadimplente(aluno({ dias: LIMITE_CRITICO_DIAS + 1 }), agora).isCritico).toBe(true)
  })

  it("sem pagamentos não tem atraso nem valor", () => {
    const r = resumirInadimplente(aluno({ pagamentos: [] }), agora)
    expect(r).toMatchObject({ diasAtraso: 0, isCritico: false, valorAberto: 0, maisAntigo: agora })
  })
})

describe("filtrarInadimplentes", () => {
  const lista = [
    aluno({ alunoId: 1, nome: "Ana Souza", turma: "Sub-9", dias: 10 }),
    aluno({ alunoId: 2, nome: "Bruno Lima", turma: "Sub-11", dias: 45 }),
    aluno({ alunoId: 3, nome: "Carla Ana", turma: "Sub-9", dias: 60 }),
  ]
  const todos = { search: "", turma: "Todas", nivel: "Todos" }
  const ids = (l: Inadimplente[]) => l.map((a) => a.alunoId)

  it("sem filtros devolve todos", () => {
    expect(ids(filtrarInadimplentes(lista, todos, agora))).toEqual([1, 2, 3])
  })

  it("busca ignora caixa e casa em qualquer parte do nome", () => {
    expect(ids(filtrarInadimplentes(lista, { ...todos, search: "ANA" }, agora))).toEqual([1, 3])
  })

  it("filtra por turma", () => {
    expect(ids(filtrarInadimplentes(lista, { ...todos, turma: "Sub-11" }, agora))).toEqual([2])
  })

  it("filtra por nível de atraso", () => {
    expect(ids(filtrarInadimplentes(lista, { ...todos, nivel: "Crítico" }, agora))).toEqual([2, 3])
    expect(ids(filtrarInadimplentes(lista, { ...todos, nivel: "Atenção" }, agora))).toEqual([1])
  })

  it("combina filtros", () => {
    expect(ids(filtrarInadimplentes(lista, { search: "ana", turma: "Sub-9", nivel: "Crítico" }, agora))).toEqual([3])
  })
})

describe("turmasDosInadimplentes", () => {
  it("devolve turmas únicas em ordem alfabética", () => {
    expect(turmasDosInadimplentes([aluno({ turma: "Sub-11" }), aluno({ turma: "Sub-9" }), aluno({ turma: "Sub-11" })])).toEqual(["Sub-11", "Sub-9"])
  })
})

describe("gerarCSVInadimplentes", () => {
  it("gera cabeçalho e uma linha por aluno, com células entre aspas separadas por ponto e vírgula", () => {
    const linhas = gerarCSVInadimplentes([aluno({ dias: 10, meses: 2 })]).split("\n")
    expect(linhas[0]).toBe('"Nome";"Turma";"Telefone";"Meses em Aberto";"Valor em Aberto (R$)";"Vencimento Mais Antigo"')
    expect(linhas[1]).toBe('"Ana Souza";"Sub-9";"(11) 91234-5678";"2";"300.00";"10/10/2026"')
  })

  it("neutraliza fórmulas de planilha no nome", () => {
    const linha = gerarCSVInadimplentes([aluno({ nome: "=HYPERLINK(1)" })]).split("\n")[1]
    expect(linha.startsWith(`"'=HYPERLINK(1)"`)).toBe(true)
  })

  it("aluno sem pagamentos fica com vencimento vazio", () => {
    expect(gerarCSVInadimplentes([aluno({ pagamentos: [] })]).split("\n")[1].endsWith('"0";"0.00";""')).toBe(true)
  })
})

describe("gerarLinkWA", () => {
  const decodificar = (url: string) => decodeURIComponent(url.split("?text=")[1])

  it("usa só dígitos do telefone com DDI 55", () => {
    expect(gerarLinkWA(aluno(), "Clube").startsWith("https://wa.me/5511912345678?text=")).toBe(true)
  })

  it("mensagem padrão cita o primeiro nome, a quantidade e o clube", () => {
    const texto = decodificar(gerarLinkWA(aluno({ meses: 2 }), "E.C. Itaquerense"))
    expect(texto).toContain("Olá Ana,")
    expect(texto).toContain("2 mensalidades em aberto na E.C. Itaquerense")
  })

  it("template troca os marcadores", () => {
    const template = "Oi {responsavel}, {aluno} deve:\n{meses}\nTotal {total}{pix}"
    const texto = decodificar(gerarLinkWA(aluno({ meses: 2 }), "Clube", template))
    expect(texto).toContain("Oi Ana, Ana Souza deve:")
    expect(texto).toContain("• 2026-09\n• 2026-08")
    expect(texto).toMatch(/Total R\$\s300,00$/)
  })
})
