/** Mascara telefone para log (LGPD): mantém só os 4 últimos dígitos. */
export function mascararTelefone(telefone: string | null | undefined): string {
  const digitos = (telefone ?? "").replace(/\D/g, "")
  if (!digitos) return "sem-telefone"
  return `***${digitos.slice(-4)}`
}
