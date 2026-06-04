export function printHTML(html: string, title = "Escolinha Itaquerense") {
  const styles = `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Inter', 'Segoe UI', sans-serif; font-size: 12px; color: #171312; padding: 24px; }
      h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; color: #7F0000; }
      h2 { font-size: 14px; font-weight: 600; margin-bottom: 12px; color: #171312; }
      p { font-size: 11px; color: #7A6F6C; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th, td { border: 1px solid #E8DEDA; padding: 6px 10px; text-align: left; font-size: 11px; }
      th { background: #F6F0EE; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #4F4543; }
      td { color: #171312; }
      .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 600; }
      .badge-success { background: #EDF9F4; color: #0F7A5A; }
      .badge-warning { background: #FFF8ED; color: #A86417; }
      .badge-danger { background: #FEF1F0; color: #B3261E; }
      .info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
      .info dt { font-size: 10px; color: #7A6F6C; text-transform: uppercase; letter-spacing: 0.5px; }
      .info dd { font-size: 13px; font-weight: 600; color: #171312; }
      .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; padding: 8px; font-size: 10px; color: #CFC4C1; border-top: 1px solid #E8DEDA; }
      @media print {
        body { padding: 12px; }
        .no-print { display: none; }
      }
    </style>
  `
  const fullHTML = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>${title}</title>${styles}</head><body>${html}<div class="footer">Escolinha Itaquerense — E.C. Itaquerense</div><script>window.print()</script></body></html>`
  const win = window.open("", "_blank")
  if (!win) return
  win.document.write(fullHTML)
  win.document.close()
}

export function printAlunoHistorico(aluno: {
  nome: string
  turma: string
  responsavel: string
  telefone: string
  mensalidade: number
  status: string
  pagamentos: { mesReferencia: string; valorRecebido: number | null; dataPagamento: string | null; formaPagamento: string | null }[]
  frequencias: { data: string; presenca: string }[]
}) {
  const pctPresenca = aluno.frequencias.length > 0
    ? Math.round((aluno.frequencias.filter((f) => f.presenca === "Presente").length / aluno.frequencias.length) * 100)
    : 0

  const html = `
    <h1>${aluno.nome}</h1>
    <p>Histórico completo do aluno</p>
    <dl class="info">
      <div><dt>Turma</dt><dd>${aluno.turma}</dd></div>
      <div><dt>Responsável</dt><dd>${aluno.responsavel}</dd></div>
      <div><dt>Telefone</dt><dd>${aluno.telefone}</dd></div>
      <div><dt>Mensalidade</dt><dd>R$ ${aluno.mensalidade.toFixed(2)}</dd></div>
      <div><dt>Status</dt><dd><span class="badge ${aluno.status === "Ativo" ? "badge-success" : "badge-danger"}">${aluno.status}</span></dd></div>
      <div><dt>% Presença</dt><dd>${pctPresenca}%</dd></div>
    </dl>
    <h2>Pagamentos</h2>
    <table>
      <thead><tr><th>Mês</th><th>Valor</th><th>Data Pagamento</th><th>Forma</th></tr></thead>
      <tbody>
        ${aluno.pagamentos.map((p) => `<tr><td>${p.mesReferencia}</td><td>${p.valorRecebido ? `R$ ${p.valorRecebido.toFixed(2)}` : "—"}</td><td>${p.dataPagamento ? new Date(p.dataPagamento).toLocaleDateString("pt-BR") : "—"}</td><td>${p.formaPagamento ?? "—"}</td></tr>`).join("")}
      </tbody>
    </table>
    <h2 style="margin-top: 20px;">Frequência</h2>
    <table>
      <thead><tr><th>Data</th><th>Presença</th></tr></thead>
      <tbody>
        ${aluno.frequencias.map((f) => `<tr><td>${new Date(f.data).toLocaleDateString("pt-BR")}</td><td><span class="badge ${f.presenca === "Presente" ? "badge-success" : f.presenca === "Justificado" ? "badge-warning" : "badge-danger"}">${f.presenca}</span></td></tr>`).join("")}
      </tbody>
    </table>
  `
  printHTML(html, `Histórico — ${aluno.nome}`)
}

export function printRecibo(recibo: {
  numero: string
  alunoNome: string
  responsavel: string
  mesReferencia: string
  valor: number
  formaPagamento: string
  dataPagamento: Date
}) {
  const html = `
    <div style="max-width: 400px; margin: 0 auto; padding: 32px; border: 2px solid #7F0000; border-radius: 8px; text-align: center;">
      <h1 style="font-size: 24px;">RECIBO</h1>
      <p style="font-size: 16px; font-weight: 600; margin: 4px 0;">Escolinha Itaquerense</p>
      <p style="font-size: 12px; color: #7A6F6C;">E.C. Itaquerense</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px dashed #E8DEDA;" />
      <p style="text-align: left; margin-bottom: 4px;"><strong>Nº:</strong> ${recibo.numero}</p>
      <p style="text-align: left; margin-bottom: 4px;"><strong>Aluno:</strong> ${recibo.alunoNome}</p>
      <p style="text-align: left; margin-bottom: 4px;"><strong>Responsável:</strong> ${recibo.responsavel}</p>
      <p style="text-align: left; margin-bottom: 4px;"><strong>Mês:</strong> ${recibo.mesReferencia}</p>
      <p style="text-align: left; margin-bottom: 4px;"><strong>Valor:</strong> R$ ${recibo.valor.toFixed(2)}</p>
      <p style="text-align: left; margin-bottom: 4px;"><strong>Forma:</strong> ${recibo.formaPagamento}</p>
      <p style="text-align: left; margin-bottom: 4px;"><strong>Data:</strong> ${new Date(recibo.dataPagamento).toLocaleDateString("pt-BR")}</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px dashed #E8DEDA;" />
      <p style="font-size: 11px; color: #7A6F6C;">Obrigado pela confiança!</p>
    </div>
  `
  printHTML(html, `Recibo ${recibo.numero}`)
}
