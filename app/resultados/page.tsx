import { permanentRedirect } from "next/navigation"

/** A página de resultados virou /partidas (agenda, resultados e classificação). */
export default function ResultadosPage() {
  permanentRedirect("/partidas")
}
