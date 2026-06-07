import { chromium } from "@playwright/test"
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const erros = []
p.on("pageerror", e => erros.push({ page: p.url(), err: e.message.slice(0,150) }))
p.on("console", m => { if (m.type()==="error" && !m.text().includes("Router action") && !m.text().includes("button")) erros.push({ page: p.url(), err: m.text().slice(0,150) }) })
await p.addInitScript(() => localStorage.setItem("escolinha_onboarding_v1","true"))
await p.goto("http://localhost:3000/login")
await p.locator("#login-usuario").fill("admin"); await p.locator("#login-senha").fill("escolinha123"); await p.click('button[type="submit"]')
await p.waitForURL(u => !u.pathname.startsWith("/login"), { timeout: 15000 })

const pages = [
  "dashboard","secretaria","alunos","pagamentos","frequencia",
  "inadimplencia","caixa","custos","campeonatos","avaliacoes",
  "uniformes","produtos","comunicados","agenda",
  "relatorio","historico",
  "configuracoes","configuracoes/responsaveis","configuracoes/matriculas"
]
const results = []
for (const pg of pages) {
  try {
    await p.goto(`http://localhost:3000/${pg}`)
    await p.waitForLoadState("networkidle")
    await p.waitForTimeout(400)
    const status = p.url().includes(pg) ? "ok" : `redirect→${p.url()}`
    const h1 = await p.locator("h1,h2").first().innerText().catch(()=>"?")
    await p.screenshot({ path: `audit-${pg.replace("/","-")}.png` })
    results.push({ pg, status, h1: h1.slice(0,40) })
  } catch(e) { results.push({ pg, status: "ERRO", h1: e.message.slice(0,60) }) }
}
console.log(JSON.stringify({ results, erros }, null, 2))
await b.close()
