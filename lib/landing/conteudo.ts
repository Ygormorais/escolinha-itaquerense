// Conteúdo institucional REAL da landing.
// Fontes: Museu do Futebol/CRFB, Fato Paulista, História do Futebol, livro do centenário.
// Fotos em public/landing/galeria — preferir acervo oficial do clube em produção.

export interface SobreConteudo {
  titulo: string
  paragrafos: string[]
  /** caminho em /public, ex.: "/landing/sobre.jpg" */
  foto?: string
}
export interface FotoGaleria {
  /** caminho em /public, ex.: "/landing/galeria/treino-1.jpg" */
  src: string
  alt: string
}
export interface Depoimento {
  texto: string
  autor: string
  /** categoria/turma do filho, ex.: "Sub-11" */
  categoria?: string
}

// === CONTEÚDO REAL ===
export const sobre: SobreConteudo | null = {
  titulo: "Nossa história",
  paragrafos: [
    "Fundada em 1º de dezembro de 1922 por José Salomão, a Sociedade Esportiva Elite Itaquerense é um dos clubes mais antigos ainda em atividade no bairro. As cores alvirrubras e a sede na Rua Augusto Carlos Baumann, 588, marcam a identidade esportiva e cultural da Zona Leste de São Paulo.",
    "Além do esporte, o clube é parte da vida de Itaquera — de gerações de futebol de campo e futsal de base a salões e eventos que reuniram a comunidade. Entre os atletas formados no Elite estão nomes que chegaram ao profissionalismo, como Kleber, Cesar e Guilherme Arana.",
    "O futsal de base, do Sub-7 ao Sub-18, já formou milhares de atletas. Em 2012, o Sub-13 foi campeão mundial na França (Hyères). Hoje a escolinha une técnica, disciplina e formação humana, com competições oficiais e acompanhamento da família pelo portal do responsável.",
  ],
  foto: "/landing/galeria/sede-elite.webp",
}

export const galeria: FotoGaleria[] = [
  {
    src: "/landing/galeria/escudo-historico.jpg",
    alt: "Primeiro distintivo do Elite Itaquerense Foot Ball Club (fundação em 1922)",
  },
  {
    src: "/landing/galeria/estatuto-escudo-1928.jpg",
    alt: "Escudo extraído do estatuto de 1928 do Elite Itaquerense",
  },
  {
    src: "/landing/galeria/uniforme-historico.jpg",
    alt: "Registro histórico de uniformes e identidade alvirrubra do clube",
  },
  {
    src: "/landing/galeria/arte-escudos.jpg",
    alt: "Arte dos escudos e uniformes históricos do Elite Itaquerense",
  },
  {
    src: "/landing/galeria/sede-elite.webp",
    alt: "Sociedade Esportiva Elite Itaquerense — referência esportiva da Zona Leste",
  },
  {
    src: "/landing/galeria/futsal-simao.jpg",
    alt: "Projeto de futsal de base do Elite Itaquerense",
  },
  {
    src: "/landing/galeria/atleta-formacao.jpg",
    alt: "Formação de atletas nas categorias de base do Elite Itaquerense",
  },
]

/**
 * Marcos reais do clube (não inventar números).
 * Fontes: Fato Paulista (série Elite 100 anos), acervo institucional.
 */
export const marcos: { valor: string; rotulo: string }[] = [
  { valor: "1922", rotulo: "Fundação em Itaquera" },
  { valor: "2012", rotulo: "Mundial Sub-13 · França" },
  { valor: "6 mil+", rotulo: "Atletas formados" },
  { valor: "1ª div.", rotulo: "Futsal Paulista" },
]

/** Citação real de Moacir Bernardes (“Simão”) — Fato Paulista, 2022. */
export const vozClube: Depoimento | null = {
  texto:
    "A filosofia do clube é a de formar seres humanos do bem e com caráter. O esporte direciona e dá disciplina — muitos que fizeram a escolinha hoje são engenheiros, professores, profissionais de sucesso.",
  autor: "Moacir Bernardes · “Simão”",
  categoria: "Coordenador de futsal",
}

export const depoimentos: Depoimento[] = vozClube ? [vozClube] : []
// =====================

export function temSobre(): boolean {
  return sobre !== null && sobre.paragrafos.length > 0
}
export function temGaleria(): boolean {
  return galeria.length > 0
}
export function temDepoimentos(): boolean {
  return depoimentos.length > 0
}
