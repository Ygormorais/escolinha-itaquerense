export function eventoAplicaATurma(turmas: string, turmaAluno: string): boolean {
  const lista = turmas.split(",").map((t) => t.trim()).filter(Boolean)
  return lista.includes("Todas") || lista.includes(turmaAluno)
}
