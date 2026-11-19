import Link from "next/link"
import { MessageCircle, UserX } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { AlunoAtencao } from "@/lib/risco-evasao"
import { cn } from "@/lib/utils"

const LIMITE = 5

/** Lista "Atenção": alunos com faltas seguidas e/ou mensalidade em atraso, com WhatsApp e mensagem pronta. */
export function RiscoEvasaoCard({ alunos }: { alunos: AlunoAtencao[] }) {
  if (alunos.length === 0) return null
  const visiveis = alunos.slice(0, LIMITE)
  return (
    <Card data-slot="atencao-evasao" className="border-danger-600/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-danger-600">
          <UserX className="size-4" aria-hidden />
          Atenção: risco de evasão ({alunos.length})
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Faltas seguidas e mensalidade em atraso. Um contato acolhedor a tempo ajuda a família a ficar.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {visiveis.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
              <Link href={`/alunos/${a.id}`} className="min-w-0 flex-1 hover:text-brand-700">
                <p className="truncate text-sm font-medium">{a.nome}</p>
                <p className="text-xs text-muted-foreground">{a.turma}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Badge className={cn("text-[10px]", a.nivel === "alto" ? "bg-danger-50 text-danger-600" : "bg-warning-50 text-warning-600")}>
                    {a.nivel === "alto" ? "Risco alto" : "Risco médio"}
                  </Badge>
                  {a.motivos.map((m) => (
                    <Badge key={m} className="bg-muted text-[10px] text-muted-foreground">{m}</Badge>
                  ))}
                </div>
              </Link>
              {a.whatsappHref ? (
                <a
                  href={a.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                  aria-label={`Chamar a família de ${a.nome} no WhatsApp (abre em nova aba)`}
                >
                  <MessageCircle aria-hidden /> WhatsApp
                </a>
              ) : (
                <span className="text-xs text-muted-foreground">Sem telefone válido</span>
              )}
            </li>
          ))}
        </ul>
        {alunos.length > LIMITE && (
          <p className="border-t px-6 py-3 text-sm">
            <Link href="/pendencias" className="font-semibold text-brand-700 hover:underline">
              Ver todos na central de pendências
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
