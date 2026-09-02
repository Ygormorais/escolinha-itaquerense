"use client"

import { useState, useTransition } from "react"
import { consultarPublicacaoResumo, publicarResumoFamiliar, retirarPublicacaoResumo } from "@/app/actions/publicacao-resumo"
import { Button } from "@/components/ui/button"

type Dados = NonNullable<Awaited<ReturnType<typeof consultarPublicacaoResumo>>["dados"]>
export function PublicacaoResumo({ resumoId }: { resumoId: number }) {
  const [dados, setDados] = useState<Dados | null>(null)
  const [revisado, setRevisado] = useState(false)
  const [retirar, setRetirar] = useState(false)
  const [erro, setErro] = useState("")
  const [pending, start] = useTransition()
  const consultar = async () => {
    const r = await consultarPublicacaoResumo(resumoId)
    if (r.dados) setDados(r.dados); else { setDados(null); setErro(r.error ?? "Resumo indisponível.") }
    setRevisado(false); setRetirar(false)
  }
  const executar = (acao: () => Promise<void>) => start(async () => { setErro(""); try { await acao() } catch { setErro("Não foi possível confirmar a operação. Atualize o estado antes de tentar novamente.") } })
  return <div className="mt-3 space-y-3 border-t pt-3 text-sm">
    <Button size="sm" variant="outline" disabled={pending} onClick={() => executar(consultar)}>{dados ? "Atualizar publicação e leitura" : "Publicar / consultar leitura"}</Button>
    {erro && <p role="alert">{erro}</p>}
    {dados && <>
      <p>Destinatário atual: {dados.responsavel ? `${dados.responsavel.nome} — família de ${dados.alunoNome}` : "sem responsável ativo vinculado a um atleta ativo"}.</p>
      {dados.publicacao ? <>
        <p role="status">{dados.publicacao.retiradoEm ? "Publicação retirada do portal." : "Versão publicada no Portal da Família."} {dados.publicacao.lidoEm ? `Leitura confirmada em ${new Date(dados.publicacao.lidoEm).toLocaleString("pt-BR")}.` : "Sem confirmação de leitura."}</p>
        {dados.responsavel?.id !== dados.publicacao.responsavelId && <p>O vínculo mudou. Esta publicação não fica disponível ao novo responsável.</p>}
        {!dados.publicacao.retiradoEm && <><label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={retirar} disabled={pending} onChange={(e) => setRetirar(e.target.checked)} />Confirmo retirar esta versão do portal.</label><Button size="sm" variant="outline" disabled={pending || !retirar} onClick={() => executar(async () => { const r = await retirarPublicacaoResumo(dados.publicacao!.id); if (r.error) setErro(r.error); else await consultar() })}>Retirar publicação</Button><p className="text-xs text-muted-foreground">A retirada não apaga o histórico nem desfaz uma leitura já realizada. Para publicar novamente, será necessária uma nova versão com o texto corrigido.</p></>}
      </> : dados.responsavel && <>
        <p>Será publicado exatamente o texto desta versão salva, exibido acima, não o rascunho em edição. Confira o mês e os dados históricos antes de publicar.</p>
        <label className="flex min-h-11 items-start gap-2"><input type="checkbox" className="mt-1" checked={revisado} disabled={pending} onChange={(e) => setRevisado(e.target.checked)} />Revisei esta versão salva e confirmo o destinatário da publicação.</label>
        <Button disabled={pending || !revisado} onClick={() => executar(async () => { const r = await publicarResumoFamiliar({ resumoId, responsavelId: dados.responsavel!.id, revisado }); setRevisado(false); if ("publicacao" in r) setDados({ ...dados, publicacao: r.publicacao }); else setErro(r.error ?? "Não foi possível publicar.") })}>Publicar esta versão no portal</Button>
        <p className="text-xs text-muted-foreground">Não envia WhatsApp, e-mail ou notificação externa. A família acessa em Desempenho.</p>
      </>}
    </>}
  </div>
}
