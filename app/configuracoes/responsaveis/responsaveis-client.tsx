"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, Pencil, Trash2, UserPlus, UserX, Mail, Phone, Search, MessageSquare, Loader2, Users } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Card, CardContent,
} from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  criarResponsavel, editarResponsavel,
  deletarResponsavel, vincularAluno, desvincularAluno,
} from "@/app/actions/responsaveis"
import { enviarWhatsAppResponsavel } from "@/app/actions/whatsapp"

type Aluno = { id: number; nome: string; turma: string }

type Responsavel = {
  id: number
  nome: string
  email: string
  telefone: string
  cpf: string | null
  ativo: boolean
  _count: { alunos: number }
  alunos: Aluno[]
}

export function ResponsaveisClient({
  responsaveis,
  alunosDisponiveis,
}: {
  responsaveis: Responsavel[]
  alunosDisponiveis: Aluno[]
}) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [vincularOpen, setVincularOpen] = useState<Responsavel | null>(null)
  const [whatsOpen, setWhatsOpen] = useState<Responsavel | null>(null)
  const [whatsMsg, setWhatsMsg] = useState("")
  const [form, setForm] = useState({
    nome: "", email: "", telefone: "", senha: "", cpf: "",
  })
  const [submitting, startSubmitting] = useTransition()
  const [whatsEnviando, startWhatsEnviando] = useTransition()
  const [vinculando, startVinculando] = useTransition()

  const filtered = responsaveis.filter((r) =>
    r.nome.toLowerCase().includes(search.toLowerCase()) ||
    r.email.toLowerCase().includes(search.toLowerCase())
  )

  function handleSubmit() {
    if (!form.nome.trim() || !form.email.trim()) {
      toast.error("Preencha nome e email")
      return
    }
    startSubmitting(async () => {
      if (editId) {
        const result = await editarResponsavel(editId, {
          nome: form.nome,
          email: form.email,
          telefone: form.telefone,
          cpf: form.cpf || null,
        })
        if (result && "error" in result) { toast.error(result.error); return }
        toast.success("Responsável atualizado!")
      } else {
        if (!form.senha) { toast.error("Defina uma senha"); return }
        const result = await criarResponsavel({
          nome: form.nome, email: form.email, telefone: form.telefone, senha: form.senha,
        })
        if ("error" in result) { toast.error(result.error); return }
        toast.success("Responsável criado!")
      }
      setDialogOpen(false)
      resetForm()
      router.refresh()
    })
  }

  function resetForm() {
    setEditId(null)
    setForm({ nome: "", email: "", telefone: "", senha: "", cpf: "" })
  }

  function handleEdit(r: Responsavel) {
    setEditId(r.id)
    setForm({ nome: r.nome, email: r.email, telefone: r.telefone, senha: "", cpf: r.cpf ? r.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : "" })
    setDialogOpen(true)
  }

  async function handleDelete(id: number, _nome: string) {
    await deletarResponsavel(id)
    toast.success("Responsável removido")
    router.refresh()
  }

  function handleVincular(alunoId: number) {
    if (!vincularOpen) return
    startVinculando(async () => {
      await vincularAluno(vincularOpen.id, alunoId)
      toast.success("Aluno vinculado!")
      router.refresh()
    })
  }

  async function handleDesvincular(alunoId: number, _alunoNome: string) {
    await desvincularAluno(alunoId)
    toast.success("Aluno desvinculado")
    router.refresh()
  }

  function handleWhatsAppEnviar() {
    if (!whatsOpen || !whatsMsg.trim()) {
      toast.error("Digite uma mensagem")
      return
    }
    startWhatsEnviando(async () => {
      const result = await enviarWhatsAppResponsavel(whatsOpen.id, whatsMsg.trim())
      if ("error" in result) { toast.error(result.error); return }
      toast.success("WhatsApp enviado!")
      setWhatsOpen(null)
      setWhatsMsg("")
    })
  }

  return (
    <div className="flex flex-col gap-6 bg-[var(--color-paper-50)]/40 p-6 lg:p-8 dark:bg-transparent">
      <PageHeader
        title="Responsáveis"
        description="Gerencie contas de acesso dos pais/responsáveis"
        action={
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm() }}>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" /> Novo Responsável
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="size-4" /> {editId ? "Editar" : "Novo"} Responsável
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resp-nome">Nome *</Label>
                <Input id="resp-nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} disabled={submitting} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resp-email">Email *</Label>
                <Input id="resp-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={submitting} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resp-tel">Telefone</Label>
                <Input id="resp-tel" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} disabled={submitting} />
              </div>
              {editId && (
                <div className="space-y-2">
                  <Label htmlFor="resp-cpf">CPF</Label>
                  <Input
                    id="resp-cpf"
                    value={form.cpf}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "").slice(0, 11)
                      const fmt = raw
                        .replace(/(\d{3})(\d)/, "$1.$2")
                        .replace(/(\d{3})(\d)/, "$1.$2")
                        .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
                      setForm({ ...form, cpf: fmt })
                    }}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    disabled={submitting}
                  />
                  <p className="text-xs text-muted-foreground">Necessário para identificação no chatbot WhatsApp</p>
                </div>
              )}
              {!editId && (
                <div className="space-y-2">
                  <Label htmlFor="resp-senha">Senha *</Label>
                  <Input id="resp-senha" type="password" autoComplete="new-password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} disabled={submitting} />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm() }}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : editId ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        }
      />

      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input className="pl-8" placeholder="Buscar por nome ou email..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Alunos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="flex flex-col items-center gap-2 py-10 text-center">
                      <Users className="size-8 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">Nenhum responsável cadastrado</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <p className="font-medium">{r.nome}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="size-3" /> {r.email}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Phone className="size-3 text-muted-foreground" />
                      {r.telefone || <span className="text-muted-foreground">—</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {r.cpf
                      ? <span className="text-sm font-mono">
                          {r.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
                        </span>
                      : <Badge variant="secondary" className="text-[10px]">sem CPF</Badge>
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 items-center">
                      <Badge variant="secondary" className="text-[10px]">{r._count.alunos}</Badge>
                      {r.alunos.map((a) => (
                        <span key={a.id} className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px]">
                          <Link href={`/alunos/${a.id}`} className="hover:underline text-brand-800">{a.nome}</Link> ({a.turma})
                          <ConfirmDialog title="Desvincular aluno?" description={`Desvincular ${a.nome} do responsável?`} confirmLabel="Desvincular" onConfirm={() => handleDesvincular(a.id, a.nome)}>
                            <button className="text-danger-600 hover:text-danger-600/80" aria-label="Desvincular aluno">
                              <UserX className="size-3" />
                            </button>
                          </ConfirmDialog>
                        </span>
                      ))}
                      <Dialog open={vincularOpen?.id === r.id} onOpenChange={(o) => { if (!o) setVincularOpen(null) }}>
                        <Button size="icon-sm" variant="ghost" className="size-5" onClick={() => setVincularOpen(r)} aria-label="Vincular aluno">
                          <UserPlus className="size-3" />
                        </Button>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <UserPlus className="size-4" /> Vincular Aluno — {r.nome}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {alunosDisponiveis.length === 0 && (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                Nenhum aluno disponível para vincular
                              </p>
                            )}
                            {alunosDisponiveis.map((a) => (
                              <button
                                key={a.id}
                                className="flex w-full items-center justify-between rounded-lg border p-3 text-sm hover:bg-muted transition-colors text-left disabled:opacity-50"
                                onClick={() => handleVincular(a.id)}
                                disabled={vinculando}
                              >
                                <span className="font-medium">{a.nome}</span>
                                <Badge variant="secondary" className="text-[10px]">{a.turma}</Badge>
                              </button>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.ativo ? "default" : "secondary"} className="text-[10px]">
                      {r.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon-sm" variant="ghost" onClick={() => { setWhatsOpen(r); setWhatsMsg("") }} aria-label="Enviar WhatsApp">
                        <MessageSquare className="size-3.5 text-brand-600" />
                      </Button>
                      <Button size="icon-sm" variant="ghost" onClick={() => handleEdit(r)} aria-label="Editar responsável">
                        <Pencil className="size-3.5" />
                      </Button>
                      <ConfirmDialog title="Remover responsável?" description={`Remover "${r.nome}" permanentemente?`} confirmLabel="Remover" onConfirm={() => handleDelete(r.id, r.nome)}>
                        <Button size="icon-sm" variant="ghost" aria-label="Remover responsável">
                          <Trash2 className="size-3.5 text-danger-600" />
                        </Button>
                      </ConfirmDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!whatsOpen} onOpenChange={(o) => { if (!o) setWhatsOpen(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="size-4" /> WhatsApp — {whatsOpen?.nome}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="whats-msg">Mensagem</Label>
            <Textarea
              id="whats-msg"
              value={whatsMsg}
              onChange={(e) => setWhatsMsg(e.target.value)}
              placeholder="Digite a mensagem para enviar via WhatsApp..."
              className="min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground">
              Telefone: {whatsOpen?.telefone || "—"}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWhatsOpen(null)}>Cancelar</Button>
            <Button onClick={handleWhatsAppEnviar} disabled={whatsEnviando}>
              {whatsEnviando ? <><Loader2 className="size-4 animate-spin" /> Enviando...</> : <><MessageSquare className="size-4" /> Enviar</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
