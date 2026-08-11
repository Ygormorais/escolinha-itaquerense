import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react"
import Link from "next/link"

export function CheckinClient({
  turma,
  data,
  token,
  ok,
  jaRegistrado,
  erro,
}: {
  turma: string
  data: string
  token: string
  ok: boolean
  jaRegistrado: boolean
  erro: string | null
}) {
  const [dia, mes, ano] = [data.slice(8, 10), data.slice(5, 7), data.slice(0, 4)]
  const dataLabel = `${dia}/${mes}/${ano}`
  const returnUrl = `/checkin?token=${encodeURIComponent(token)}`

  if (ok) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
        <CheckCircle2 className={`size-16 ${jaRegistrado ? "text-warning-600" : "text-success-600"}`} />
        <div>
          <h1 className="font-heading text-2xl font-bold">
            {jaRegistrado ? "Presença já registrada" : "Presença confirmada!"}
          </h1>
          <p className="mt-2 text-muted-foreground">{turma} · {dataLabel}</p>
        </div>
        <Link href={returnUrl} className="text-sm text-brand-700 hover:underline">
          Registrar outro aluno →
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          {erro ? <XCircle className="mx-auto mb-3 size-10 text-destructive" /> : <ShieldCheck className="mx-auto mb-3 size-10 text-brand-600" />}
          <h1 className="font-heading text-2xl font-bold">Check-in de Presença</h1>
          <p className="mt-1 text-sm text-muted-foreground">{turma} · {dataLabel}</p>
        </div>

        {erro && (
          <p role="alert" className="rounded-lg bg-danger-50 p-3 text-center text-sm text-danger-700">
            Dados não conferem. Verifique a matrícula, a data de nascimento e a turma.
          </p>
        )}

        <form action="/api/checkin" method="post" className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
          <input type="hidden" name="token" value={token} />
          <div>
            <label htmlFor="matricula" className="mb-1.5 block text-sm font-medium">Número da matrícula</label>
            <input
              id="matricula"
              name="matricula"
              inputMode="numeric"
              pattern="[0-9]{1,10}"
              autoComplete="off"
              required
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-base"
              placeholder="Ex.: 000123"
            />
          </div>
          <div>
            <label htmlFor="dataNascimento" className="mb-1.5 block text-sm font-medium">Data de nascimento</label>
            <input
              id="dataNascimento"
              name="dataNascimento"
              type="date"
              required
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-base"
            />
          </div>
          <button type="submit" className="h-11 w-full rounded-md bg-brand-700 px-4 font-semibold text-white transition-colors hover:bg-brand-800">
            Confirmar presença
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Seus dados são usados somente para confirmar sua identidade e não ficam visíveis para outras pessoas.
        </p>
      </div>
    </div>
  )
}
