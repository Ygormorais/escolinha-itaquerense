"use client"

import { useState, useEffect } from "react"
import { MessageCircle, Check, CheckCheck, Clock, XCircle, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getHistoricoWhatsApp } from "@/app/actions/whatsapp"

type Props = {
  alunoId: number
  alunoNome: string
}

type Mensagem = {
  id: number
  mensagem: string
  direcao: string
  status: string
  origem: string
  createdAt: Date
  tipo: string
}

export function WhatsAppHistory({ alunoId, alunoNome }: Props) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([])

  useEffect(() => {
    getHistoricoWhatsApp(alunoId).then(setMensagens)
  }, [alunoId])

  const statusIcon = (status: string) => {
    switch (status) {
      case "sent": return <Check className="size-3.5 text-muted-foreground" />
      case "delivered": return <CheckCheck className="size-3.5 text-muted-foreground" />
      case "read": return <CheckCheck className="size-3.5 text-info-600" />
      case "failed": return <XCircle className="size-3.5 text-danger-600" />
      case "received": return <Clock className="size-3.5 text-warning-600" />
      default: return <Clock className="size-3.5 text-muted-foreground" />
    }
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case "sent": return "Enviada"
      case "delivered": return "Entregue"
      case "read": return "Visualizada"
      case "failed": return "Falhou"
      case "received": return "Recebida"
      default: return status
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href={`/alunos/${alunoId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <MessageCircle className="size-5 text-brand-600" />
          <CardTitle>Histórico de WhatsApp — {alunoNome}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {mensagens.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma mensagem encontrada
          </p>
        ) : (
          <div className="space-y-3">
            {mensagens.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 p-3 rounded-lg border ${
                  msg.direcao === "incoming"
                    ? "bg-brand-50/30 border-brand-100"
                    : "bg-muted/30 border-border"
                }`}
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={msg.direcao === "incoming" ? "default" : "secondary"} className="text-[10px] uppercase">
                      {msg.direcao === "incoming" ? "Recebida" : "Enviada"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(msg.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.mensagem}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {statusIcon(msg.status)}
                    <span>{statusLabel(msg.status)}</span>
                    <span className="text-[10px] uppercase opacity-50">{msg.origem}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
