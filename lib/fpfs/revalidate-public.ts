import { revalidatePath } from "next/cache"

/** Invalida páginas públicas e portal que mostram jogos/classificação FPFS. */
export function revalidateFpfsPublico() {
  revalidatePath("/")
  revalidatePath("/resultados")
  revalidatePath("/agenda")
  revalidatePath("/responsavel/jogos")
  revalidatePath("/responsavel/classificacao")
  revalidatePath("/campeonatos")
}
