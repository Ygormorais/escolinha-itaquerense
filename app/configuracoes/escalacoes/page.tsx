import { db } from "@/lib/db"
import { reativarEscalacao } from "@/app/actions/escalacoes"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default async function EscalacoesPage() {
  const sessoes = await db.chatSession.findMany({
    where: { bloqueado: true },
    include: { responsavel: true },
    orderBy: { updatedAt: "desc" },
  })

  const sessoesCom = await Promise.all(
    sessoes.map(async (s) => {
      const log = await db.log.findFirst({
        where: {
          tipo: "escalacao_chatbot",
          meta: { contains: s.telefone },
        },
        orderBy: { id: "desc" },
      })
      let motivo = "—"
      if (log?.meta) {
        try {
          const meta = JSON.parse(log.meta) as { motivo?: string }
          if (meta.motivo) motivo = meta.motivo
        } catch {
          // meta inválido
        }
      }
      return { ...s, motivo }
    })
  )

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Escalações Pendentes</h1>
        <Badge variant="destructive">{sessoes.length}</Badge>
      </div>

      {sessoes.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma escalação pendente.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Responsável</TableHead>
              <TableHead>Número</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessoesCom.map((s) => (
              <TableRow key={s.telefone}>
                <TableCell>{s.responsavel?.nome ?? <span className="text-muted-foreground italic">desconhecido</span>}</TableCell>
                <TableCell className="font-mono text-sm">{s.telefone}</TableCell>
                <TableCell className="max-w-xs truncate">{s.motivo}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {s.updatedAt.toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell>
                  <form
                    action={async () => {
                      "use server"
                      await reativarEscalacao(s.telefone)
                    }}
                  >
                    <Button type="submit" size="sm" variant="outline">
                      Reativar bot
                    </Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
