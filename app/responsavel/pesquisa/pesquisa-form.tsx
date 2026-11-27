"use client"

import { useState, useTransition } from "react"
import { CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { responderPesquisa } from "@/app/actions/satisfacao"
import { Button, buttonVariants } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MAX_COMENTARIO, urlAvaliacaoGoogle } from "@/lib/satisfacao"

const NOTAS = Array.from({ length: 11 }, (_, i) => i)

export function PesquisaForm({ pesquisaId, titulo, pergunta, avaliacaoUrl }: { pesquisaId: number; titulo: string; pergunta: string; avaliacaoUrl?: string }) {
  const [nota, setNota] = useState<number | null>(null)
  const [comentario, setComentario] = useState("")
  const [anonimo, setAnonimo] = useState(false)
  const [enviada, setEnviada] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function enviar(event: React.FormEvent) {
    event.preventDefault()
    if (nota === null) {
      setErro("Escolha uma nota de 0 a 10.")
      return
    }
    setErro(null)
    startTransition(async () => {
      const resultado = await responderPesquisa({ pesquisaId, nota, comentario, anonimo })
      if ("error" in resultado) {
        setErro(resultado.error)
        toast.error(resultado.error)
        return
      }
      setEnviada(true)
      toast.success("Resposta enviada. Obrigado!")
    })
  }

  if (enviada) {
    const linkGoogle = nota === null ? null : urlAvaliacaoGoogle(avaliacaoUrl, nota)
    return (
      <section role="status" className="flex flex-col items-center gap-3 rounded-xl border bg-card p-8 text-center">
        <CheckCircle2 className="size-10 text-success-600" aria-hidden />
        <h2 className="font-heading text-xl font-bold">Obrigado pela sua opinião!</h2>
        <p className="max-w-md text-sm text-muted-foreground">Ela chega direto à coordenação da escolinha e ajuda a melhorar a experiência dos atletas e das famílias.</p>
        {linkGoogle ? (
          <>
            <p className="max-w-md text-sm text-muted-foreground">Que bom que você recomenda! Se puder, conte isso também no Google: ajuda outras famílias a nos encontrar.</p>
            <a href={linkGoogle} target="_blank" rel="noopener noreferrer" className={buttonVariants()}>
              Avaliar a escolinha no Google
            </a>
          </>
        ) : null}
      </section>
    )
  }

  return (
    <form onSubmit={enviar} className="mx-auto w-full max-w-2xl space-y-6 rounded-xl border bg-card p-4 sm:p-6" aria-labelledby="pesquisa-titulo" noValidate>
      <div>
        <h2 id="pesquisa-titulo" className="font-heading text-lg font-bold">{titulo}</h2>
        <p className="mt-1 text-xs text-muted-foreground">Leva menos de um minuto. A resposta é por família.</p>
      </div>

      <fieldset aria-describedby={erro ? "pesquisa-erro" : undefined}>
        <legend className="text-base font-semibold">{pergunta}</legend>
        <div className="mt-3 grid grid-cols-6 gap-2 sm:grid-cols-11" role="radiogroup" aria-label="Nota de 0 a 10">
          {NOTAS.map((n) => (
            <label
              key={n}
              className={`flex min-h-11 cursor-pointer items-center justify-center rounded-lg border text-sm font-bold transition-colors focus-within:ring-2 focus-within:ring-ring has-[:checked]:border-brand-700 has-[:checked]:bg-brand-700 has-[:checked]:text-white ${nota === n ? "" : "bg-background hover:bg-muted"}`}
            >
              <input type="radio" name="nota" value={n} checked={nota === n} onChange={() => setNota(n)} className="sr-only" />
              {n}
            </label>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground" aria-hidden>
          <span>0 · Nada provável</span>
          <span>10 · Com certeza</span>
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="pesquisa-comentario">O que motivou a sua nota? (opcional)</Label>
        <Textarea id="pesquisa-comentario" value={comentario} maxLength={MAX_COMENTARIO} rows={4} onChange={(e) => setComentario(e.target.value)} aria-describedby="pesquisa-comentario-ajuda" />
        <p id="pesquisa-comentario-ajuda" className="text-xs text-muted-foreground">
          Não escreva dados de saúde, documentos ou nomes de outras crianças. {comentario.length}/{MAX_COMENTARIO}
        </p>
      </div>

      <label className="flex min-h-11 items-start gap-3 text-sm">
        <input type="checkbox" className="mt-1 size-4 shrink-0" checked={anonimo} onChange={(e) => setAnonimo(e.target.checked)} />
        <span>Prefiro que meu nome não apareça junto da minha resposta. A coordenação não poderá entrar em contato por causa dela.</span>
      </label>

      {erro && <p id="pesquisa-erro" role="alert" className="text-sm font-medium text-destructive">{erro}</p>}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">Usamos sua resposta só para melhorar a escolinha, conforme a Política de Privacidade.</p>
        <Button type="submit" disabled={pending}>{pending ? "Enviando..." : "Enviar resposta"}</Button>
      </div>
    </form>
  )
}
