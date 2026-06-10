import { createHmac, timingSafeEqual } from "crypto"

function secret(): string { return process.env.SESSION_SECRET ?? "dev-secret" }

export function gerarHmacQr(alunoId: number): string {
  return createHmac("sha256", secret()).update(String(alunoId)).digest("hex")
}

export function validarHmacQr(alunoId: number, h: string): boolean {
  const expected = gerarHmacQr(alunoId)
  try {
    return expected.length === h.length && timingSafeEqual(Buffer.from(expected), Buffer.from(h))
  } catch { return false }
}
