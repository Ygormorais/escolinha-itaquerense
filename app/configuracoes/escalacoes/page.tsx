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

  // fetch all escalation logs for the blocked sessions in one query
  const telefones = sessoes.map((s) => s.telefone)
  const logs = telefones.length > 0
    ? await db.log.findMany({
        where: { tipo: "escalacao_chatbot" },
        orderBy: { id: "desc" },
      })
    : []

  // build a telefone → motivo map (first matching log per telefone wins)
  const motivoMap = new Map<string, string>()
  for (const log of logs) {
    if (!log.meta) continue
    try {
      const meta = JSON.parse(log.meta) as { motivo?: string; telefone?: string }
      if (meta.telefone && meta.motivo && !motivoMap.has(meta.telefone)) {
        motivoMap.set(meta.telefone, meta.motivo)
      }
    } catch {
      // meta inválido
    }
  }

  const sessoesCom = sessoes.map((s) => ({
    ...s,
    motivo: motivoMap.get(s.telefone) ?? "—",
  }))

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Escalações Pendentes</h1>
        <Badge variant="destructive">{sessoesCom.length}</Badge>
      </div>

      {sessoesCom.length === 0 ? (
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
