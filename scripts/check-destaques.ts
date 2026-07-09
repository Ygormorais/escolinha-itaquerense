import { getNoticiasCarrossel } from "../lib/landing/noticias"
import { getHeroDestaque, heroView } from "../lib/landing/jogos"

async function main() {
  const cards = await getNoticiasCarrossel()
  console.log("=== DESTAQUES ===")
  for (const c of cards) {
    console.log(`- [${c.resultado}] ${c.titulo}`)
    console.log(`  ${c.href} (externo=${c.externo})`)
  }
  const hero = heroView(await getHeroDestaque())
  console.log("\n=== HERO ===")
  console.log(hero.titulo)
  console.log(hero.ctaHref, hero.ctaLabel, "externo=", hero.ctaExterno)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => process.exit(0))
