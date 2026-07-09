async function main() {
  const page = await fetch("https://eventos.admfutsal.com.br/evento/851/jogos", {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  })
  console.log("page", page.status)
  const setCookie =
    typeof page.headers.getSetCookie === "function" ? page.headers.getSetCookie() : []
  console.log("cookies", setCookie)

  const html = await page.text()
  const m = html.match(
    /src=["'](https?:\/\/admfutsal\.com\.br\/assets\/images\/foto\/escudo\/\d+\.png)["']/i,
  )
  console.log("first escudo", m?.[1])
  if (!m) return

  const cookieHeader = setCookie.map((c) => c.split(";")[0]).join("; ")
  const r = await fetch(m[1], {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: "https://eventos.admfutsal.com.br/evento/851/jogos",
      Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
  })
  console.log("escudo", r.status, r.headers.get("content-type"), r.url)
  if (r.ok) {
    const buf = await r.arrayBuffer()
    console.log("bytes", buf.byteLength)
  }

  // Also try Wikipedia for a known club as secondary source demo
  const wiki =
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Escudo_do_Corinthians.svg/120px-Escudo_do_Corinthians.svg.png"
  const w = await fetch(wiki)
  console.log("wiki corinthians", w.status, w.headers.get("content-type"))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
