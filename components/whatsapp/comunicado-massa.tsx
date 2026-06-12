"use client"

import { useState, useTransition } from "react"
import { plural } from "@/lib/utils"
import { Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { enviarComunicadoMassa } from "@/app/actions/whatsapp"
import { TURMAS } from "@/lib/constants"

export function ComunicadoMassa() {
  const [mensagem, setMensagem] = useState("")
  const [turma, setTurma] = useState<string>("Todas")
  const [pending, start] = useTransition()
  const [resultado, setResultado] = useState<{ enviados: number; erros: number; semTelefone: number } | null>(null)

  function handleEnviar() {
    if (!mensagem.trim()) return
    start(async () => {
      const result = await enviarComunicadoMassa(mensagem, turma)
      if ("enviados" in result) {
        setResultado(result)
        toast.success(`Enviado para ${plural(result.enviados, "aluno", "alunos", "nenhum")}`)
      } else {
        toast.error(result.error ?? "Erro ao enviar comunicado")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enviar Comunicado em Massa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="turma">Turma</Label>
          <select
            id="turma"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={turma}
            onChange={(e) => setTurma(e.target.value)}
          >
            <option value="Todas">Todas as turmas</option>
            {TURMAS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mensagem">Mensagem</Label>
          <textarea
            id="mensagem"
            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Digite o comunicado que será enviado para todos os alunos da turma selecionada..."
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
          />
        </div>

        <Button onClick={handleEnviar} disabled={pending || !mensagem.trim()} className="gap-2">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Enviar Comunicado
        </Button>

        {resultado && (
          <div className="text-sm text-muted-foreground space-y-1 pt-2 border-t">
            <p className="text-success-600">✓ {plural(resultado.enviados, "mensagem enviada", "mensagens enviadas", "nenhuma")}</p>
            {resultado.erros > 0 && <p className="text-danger-600">✗ {plural(resultado.erros, "erro", "erros", "nenhum")}</p>}
            {resultado.semTelefone > 0 && <p className="text-warning-600">⚠ {resultado.semTelefone} sem telefone</p>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
