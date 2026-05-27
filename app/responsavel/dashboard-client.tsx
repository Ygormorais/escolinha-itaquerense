"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  User, CreditCard,
  CalendarCheck, Shirt, MessageSquare, Phone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

type Aluno = {
  id: number
  nome: string
  turma: string
  mensalidade: number
  desconto: number
  pagamentos: { mesReferencia: string; dataPagamento: string | null; valorRecebido: number | null; formaPagamento: string | null }[]
  frequencias: { data: string; presenca: string }[]
  uniformes: { item: string; entregue: boolean }[]
}

type Comunicado = { mensagem: string; createdAt: string }

export function ResponsavelDashboardClient({
  responsavel,
  comunicados,
}: {
  responsavel: { nome: string; alunos: Aluno[] }
  comunicados: Comunicado[]
}) {
  const [whatsappNumber, setWhatsappNumber] = useState("5511999999999")
  useEffect(() => {
    fetch("/api/config/public")
      .then((r) => r.json())
      .then((d) => { if (d.whatsapp) setWhatsappNumber(d.whatsapp) })
      .catch(() => {})
  }, [])

  function statusPagamento(aluno: Aluno): { label: string; variant: "default" | "secondary" | "outline" | "destructive" } {
    const mesAtual = format(new Date(), "yyyy-MM")
    const pago = aluno.pagamentos.find((p) => p.mesReferencia === mesAtual)
    if (pago?.dataPagamento) return { label: "Em dia", variant: "default" }
    return { label: "Pendente", variant: "destructive" }
  }

  function frequenciaUltimos(aluno: Aluno): string {
    const recentes = aluno.frequencias.slice(0, 5)
    if (recentes.length === 0) return "Nenhum registro"
    const presencas = recentes.filter((f) => f.presenca === "presente").length
    return `${presencas}/${recentes.length} presenças`
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Olá, {responsavel.nome}</h1>
        <p className="text-sm text-muted-foreground">Portal do Responsável</p>
      </div>

      {responsavel.alunos.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum aluno vinculado à sua conta.
          </CardContent>
        </Card>
      )}

      {responsavel.alunos.map((aluno) => {
        const st = statusPagamento(aluno)
        return (
          <Card key={aluno.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <User className="size-5 text-brand-600" />
                <CardTitle className="text-lg">{aluno.nome}</CardTitle>
                <Badge variant="secondary" className="text-[10px]">{aluno.turma}</Badge>
              </div>
              <Badge variant={st.variant}>{st.label}</Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CreditCard className="size-3" /> Mensalidade
                  </p>
                  <p className="text-sm font-semibold">
                    R$ {(aluno.mensalidade - aluno.desconto).toFixed(2)}
                    {aluno.desconto > 0 && <span className="text-xs text-success-600 ml-1">(-{aluno.desconto.toFixed(2)})</span>}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CalendarCheck className="size-3" /> Frequência
                  </p>
                  <p className="text-sm">{frequenciaUltimos(aluno)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Shirt className="size-3" /> Uniforme
                  </p>
                  <p className="text-sm">
                    {aluno.uniformes.filter((u) => u.entregue).length}/{aluno.uniformes.length} itens
                  </p>
                </div>
                <div className="flex items-end justify-end">
                  <Link href={`/responsavel/mensalidades?alunoId=${aluno.id}`}>
                    <Button variant="outline" size="sm">Ver Mensalidades</Button>
                  </Link>
                </div>
              </div>

              {aluno.pagamentos.length > 0 && (
                <div className="mt-4 border-t pt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Últimos Pagamentos</p>
                  <div className="space-y-1">
                    {aluno.pagamentos.slice(0, 3).map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span>{p.mesReferencia}</span>
                        <span className={p.dataPagamento ? "text-success-600" : "text-muted-foreground"}>
                          {p.dataPagamento ? `R$ ${p.valorRecebido?.toFixed(2)}` : "Pendente"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="size-4" /> Fale Conosco
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            Entre em contato com a escolinha pelo WhatsApp:
          </p>
          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
          >
            <MessageSquare className="size-4" /> Falar no WhatsApp
          </a>
        </CardContent>
      </Card>

      {comunicados.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="size-4" /> Comunicados Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {comunicados.map((c, i) => (
              <div key={i} className="rounded-lg border p-3">
                <p className="text-sm whitespace-pre-wrap">{c.mensagem}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {format(new Date(c.createdAt), "dd/MM/yyyy 'às' HH:mm")}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
