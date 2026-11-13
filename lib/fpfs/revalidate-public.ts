import { revalidatePath, revalidateTag } from "next/cache"

/** Invalida páginas públicas e portal que mostram jogos/classificação FPFS. */
export function revalidateFpfsPublico() {
  // A landing lê jogos por unstable_cache; sem invalidar a tag, o carrossel fica velho.
  revalidateTag("landing-jogos", { expire: 0 })
  revalidatePath("/")
  revalidatePath("/partidas")
  revalidatePath("/agenda")
  revalidatePath("/buscar")
  revalidatePath("/responsavel/jogos")
  revalidatePath("/responsavel/classificacao")
  revalidatePath("/campeonatos")
}
