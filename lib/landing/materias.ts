/**
 * Matérias institucionais da landing — curadoria de fontes públicas sobre o Elite.
 * Fontes: Fato Paulista, História do Futebol, Museu do Futebol/CRFB, acervo do clube.
 * Links externos abrem a matéria original (não inventar fatos).
 */

export type MateriaAbaId =
  | "destaques"
  | "mundial"
  | "conquistas"
  | "participacoes"
  | "clube"
  | "publicacoes"

export interface MateriaAba {
  id: MateriaAbaId
  label: string
}

export interface MateriaCard {
  id: string
  /** Aba principal onde o card aparece */
  aba: Exclude<MateriaAbaId, "destaques" | "publicacoes">
  /** Também listado em Destaques (as mais relevantes) */
  destaque?: boolean
  badge: string
  titulo: string
  resumo: string
  /** Ano ou período curto, ex.: "2012" */
  periodo?: string
  /** Imagem local em /public */
  imagem?: string
  href?: string
  externo?: boolean
  /** Fonte curta para crédito */
  fonte?: string
}

export const MATERIAS_ABAS: MateriaAba[] = [
  { id: "destaques", label: "Destaques" },
  { id: "mundial", label: "Mundial" },
  { id: "conquistas", label: "Conquistas" },
  { id: "participacoes", label: "Participações" },
  { id: "clube", label: "Clube" },
]

const FP = "Fato Paulista"
const HDF = "História do Futebol"
const MUSEU = "Museu do Futebol"

/** Conteúdo curado da internet + acervo (sempre na landing). */
export const MATERIAS: MateriaCard[] = [
  // ── Mundial ──────────────────────────────────────────
  {
    id: "mundial-2012",
    aba: "mundial",
    destaque: true,
    badge: "Mundial",
    periodo: "2012",
    titulo: "Campeão Mundial Sub-13 na França",
    resumo:
      "Em Hyères, o Sub-13 do Elite Itaquerense conquistou o Mundial de futsal. Na final, venceu o Lion (França) e eliminou rivais de tradição mundial, como a Fiorentina (Itália). A maior glória da modalidade no clube — e orgulho da Zona Leste.",
    imagem: "/landing/galeria/futsal-simao.jpg",
    href: "https://fatopaulista.com.br/futsal-do-elite-orgulha-a-zona-leste-com-conquistas-e-revelando-craques/",
    externo: true,
    fonte: FP,
  },
  {
    id: "mundial-tecnico",
    aba: "mundial",
    badge: "Comissão",
    periodo: "2012",
    titulo: "Douglinhas e a campanha histórica",
    resumo:
      "O técnico Douglinhas comandou a equipe campeã mundial e ficou 15 anos no Elite. O título de 2012 é referência permanente da escolinha de futsal alvirrubra.",
    href: "https://fatopaulista.com.br/futsal-do-elite-orgulha-a-zona-leste-com-conquistas-e-revelando-craques/",
    externo: true,
    fonte: FP,
  },
  {
    id: "mundial-simao",
    aba: "mundial",
    badge: "Coordenação",
    periodo: "base",
    titulo: "Polo revelador sob o comando de Simão",
    resumo:
      "Moacir Bernardes (“Simão”), ex-goleiro com passagens por Portuguesa e Corinthians, coordena o futsal do Elite há mais de duas décadas. O projeto, do Sub-7 ao Sub-18, é apontado como usina de talentos da Zona Leste.",
    imagem: "/landing/galeria/futsal-simao.jpg",
    href: "https://fatopaulista.com.br/futsal-do-elite-orgulha-a-zona-leste-com-conquistas-e-revelando-craques/",
    externo: true,
    fonte: FP,
  },

  // ── Conquistas ───────────────────────────────────────
  {
    id: "paulista-sub10-2020",
    aba: "conquistas",
    destaque: true,
    badge: "Título",
    periodo: "2020",
    titulo: "Campeão Paulista Sub-10",
    resumo:
      "O Sub-10 sagrou-se campeão paulista em 2020 — conquista que reforça a força da base do Elite nas categorias de iniciação da Federação Paulista de Futsal.",
    imagem: "/landing/galeria/sede-elite.webp",
    href: "https://fatopaulista.com.br/futsal-do-elite-orgulha-a-zona-leste-com-conquistas-e-revelando-craques/",
    externo: true,
    fonte: FP,
  },
  {
    id: "vice-sub18-2020",
    aba: "conquistas",
    badge: "Vice",
    periodo: "2020",
    titulo: "Vice-campeão Paulista Sub-18",
    resumo:
      "No mesmo ciclo, o Sub-18 ficou com o vice no Paulista, confirmando o Elite entre as potências da base paulista.",
    href: "https://fatopaulista.com.br/futsal-do-elite-orgulha-a-zona-leste-com-conquistas-e-revelando-craques/",
    externo: true,
    fonte: FP,
  },
  {
    id: "vice-sub16-2021",
    aba: "conquistas",
    badge: "Vice",
    periodo: "2021",
    titulo: "Vice-campeonato Sub-16 e semifinal Sub-18",
    resumo:
      "Mesmo na pandemia, o Sub-16 conquistou o vice. O Sub-18 chegou à semifinal (3º lugar) com apenas duas derrotas no campeonato — derrota na semi para o forte São José.",
    href: "https://fatopaulista.com.br/futsal-do-elite-orgulha-a-zona-leste-com-conquistas-e-revelando-craques/",
    externo: true,
    fonte: FP,
  },
  {
    id: "sub20-finais",
    aba: "conquistas",
    badge: "Final",
    periodo: "base",
    titulo: "Duas finais de Sub-20 contra o Corinthians",
    resumo:
      "Na categoria Sub-20, o Elite chegou duas vezes à final estadual diante do Sport Club Corinthians Paulista — prova do nível competitivo do projeto.",
    href: "https://fatopaulista.com.br/futsal-do-elite-orgulha-a-zona-leste-com-conquistas-e-revelando-craques/",
    externo: true,
    fonte: FP,
  },
  {
    id: "benjamin-artilharia",
    aba: "conquistas",
    badge: "Destaque",
    periodo: "2025",
    titulo: "Benjamim Martinho brilha no Paulista",
    resumo:
      "O jovem ala do futsal eliteano Benjamim Martinho despontou na artilharia do Campeonato Paulista — mais um nome da base a chamar atenção da imprensa esportiva da Zona Leste.",
    href: "https://fatopaulista.com.br/revelacao-do-elite-itaquerense-se-inspirou-no-marcelinho-carioca/",
    externo: true,
    fonte: FP,
  },
  {
    id: "vitoria-praia-grande",
    aba: "conquistas",
    badge: "Jogo",
    periodo: "2022",
    titulo: "Futsal: Elite vence o Praia Grande",
    resumo:
      "A Sociedade Esportiva Elite Itaquerense manteve a tradição no futsal como verdadeira usina formadora de talentos, com vitória destacada pela imprensa local.",
    href: "https://fatopaulista.com.br/futsal-elite-itaquerense-vence-o-praia-grande/",
    externo: true,
    fonte: FP,
  },

  // ── Participações / formação ─────────────────────────
  {
    id: "elite-primeira-divisao",
    aba: "participacoes",
    destaque: true,
    badge: "Elite",
    periodo: "hoje",
    titulo: "Primeira divisão do futsal paulista",
    resumo:
      "O Elite integra a primeira divisão do Campeonato Paulista de Futsal e figura entre os clubes de referência da modalidade em São Paulo, ao lado de gigantes como o Corinthians.",
    imagem: "/landing/galeria/arte-escudos.jpg",
    href: "https://fatopaulista.com.br/futsal-do-elite-orgulha-a-zona-leste-com-conquistas-e-revelando-craques/",
    externo: true,
    fonte: FP,
  },
  {
    id: "milhares-atletas",
    aba: "participacoes",
    badge: "Base",
    periodo: "22+ anos",
    titulo: "Mais de 6 mil atletas formados",
    resumo:
      "Desde o início do projeto de futsal sob a coordenação de Simão, milhares de meninos e meninas passaram pelas categorias Sub-7 ao Sub-18 — com ou sem mensalidade, priorizando caráter e disciplina.",
    href: "https://fatopaulista.com.br/futsal-do-elite-orgulha-a-zona-leste-com-conquistas-e-revelando-craques/",
    externo: true,
    fonte: FP,
  },
  {
    id: "revelacoes",
    aba: "participacoes",
    destaque: true,
    badge: "Formação",
    periodo: "legado",
    titulo: "Craques formados no vermelho e branco",
    resumo:
      "No futebol de campo, três laterais esquerdos saíram da base: Kleber, Cesar e Guilherme Arana (Seleção). No futsal, dezenas de atletas chegaram a grandes clubes e à seleção — entre eles Luís Felipe e Felipe Valério.",
    imagem: "/landing/galeria/escudo-historico.jpg",
    href: "https://historiadofutebol.com/blog/?p=134731",
    externo: true,
    fonte: HDF,
  },
  {
    id: "300-alunos-futsal",
    aba: "participacoes",
    badge: "Escolinha",
    periodo: "hoje",
    titulo: "Cerca de 300 alunos no futsal",
    resumo:
      "Em entrevista ao Fato Paulista, a presidência destacou cerca de 300 alunos em diversas categorias de futsal e mais de 20 jogadores revelados para o cenário nacional e internacional.",
    href: "https://fatopaulista.com.br/fato-paulista-entrevista-presidente-do-elite-itaquerense/",
    externo: true,
    fonte: FP,
  },
  {
    id: "taca-sp-1931",
    aba: "participacoes",
    badge: "História",
    periodo: "1931",
    titulo: "Taça de São Paulo de 1931",
    resumo:
      "No futebol amador, o Elite disputou a Taça de São Paulo de 1931 — o 1º grande campeonato amador da cidade, organizado pelo jornal A Gazeta, com 203 agremiações inscritas.",
    imagem: "/landing/galeria/uniforme-historico.jpg",
    href: "https://historiadofutebol.com/blog/?p=134731",
    externo: true,
    fonte: HDF,
  },

  // ── Clube / imprensa / cultura ───────────────────────
  {
    id: "fundacao-1922",
    aba: "clube",
    destaque: true,
    badge: "Origem",
    periodo: "1922",
    titulo: "Fundado em 1º de dezembro de 1922",
    resumo:
      "José Salomão, comerciante sírio-libanês, fundou o Elite Itaquerense Foot Ball Club em Itaquera. O nome “Elite” veio de uma marca de roupas da época; as cores vermelho e branco nunca foram abandonadas. É o clube de futebol mais antigo do bairro ainda em atividade.",
    imagem: "/landing/galeria/escudo-historico.jpg",
    href: "https://historiadofutebol.com/blog/?p=134731",
    externo: true,
    fonte: HDF,
  },
  {
    id: "103-anos",
    aba: "clube",
    destaque: true,
    badge: "Aniversário",
    periodo: "2025",
    titulo: "Elite Itaquerense comemora 103 anos",
    resumo:
      "Almoço com as “mamas do Elite”, entrega de Título de Sócio Benemérito e foto de gerações — passado, presente e futuro reunidos no salão do clube em dezembro de 2025.",
    imagem: "/landing/galeria/sede-elite.webp",
    href: "https://fatopaulista.com.br/elite-itaquerense-comemora-103-anos/",
    externo: true,
    fonte: FP,
  },
  {
    id: "102-anos",
    aba: "clube",
    badge: "Aniversário",
    periodo: "2024",
    titulo: "102 anos orgulhando o bairro",
    resumo:
      "Quando se fala em Itaquera fora da região, uma das primeiras associações é o Elite. O Fato Paulista relembrou carnavais com Tim Maia e Roberto Carlos no salão, craques revelados e o olhar de futuro do centenário alvirrubro.",
    href: "https://fatopaulista.com.br/elite-itaquerense-completa-102-anos-orgulhando-o-bairro/",
    externo: true,
    fonte: FP,
  },
  {
    id: "centenario-festa",
    aba: "clube",
    badge: "Centenário",
    periodo: "2022",
    titulo: "Mais de 700 pessoas na festa de 100 anos",
    resumo:
      "O salão nobre recebeu mais de 700 convidados no baile-coquetel pelos 100 anos da Sociedade Esportiva Elite Itaquerense — marco social e esportivo de Itaquera.",
    href: "https://fatopaulista.com.br/mais-de-700-pessoas-na-festa-de-100-anos-do-elite-itaquerense/",
    externo: true,
    fonte: FP,
  },
  {
    id: "centenario-reforma",
    aba: "clube",
    badge: "Obra",
    periodo: "2022",
    titulo: "No centenário, grande reforma na sede",
    resumo:
      "Em 2022 o clube investiu em melhorias na sede — deck, iluminação e novos espaços — modernizando a estrutura sem perder a identidade centenária da Zona Leste.",
    href: "https://fatopaulista.com.br/em-seu-centenario-elite-itaquerense-recebe-grande-reforma/",
    externo: true,
    fonte: FP,
  },
  {
    id: "livro-100-anos",
    aba: "clube",
    destaque: true,
    badge: "Livro",
    periodo: "2023",
    titulo: "Livro: 100 anos de História e Glórias",
    resumo:
      "Obra do Dr. Marco A. Stanojev Pereira, Ph.D., com depoimentos, pesquisa e memórias familiares. Conta a fundação por José Salomão e a trajetória do clube como grande família de Itaquera.",
    imagem: "/landing/galeria/estatuto-escudo-1928.jpg",
    href: "https://fatopaulista.com.br/livro-100-anos-de-historia-e-glorias-conta-a-historia-do-elite-itaquerense/",
    externo: true,
    fonte: FP,
  },
  {
    id: "entrevista-presidente",
    aba: "clube",
    badge: "Entrevista",
    periodo: "2024",
    titulo: "Entrevista com o presidente Helinho",
    resumo:
      "Hélio Fraguglia Mussolino falou ao Fato Paulista sobre três gerações da família no clube, modernização da gestão, futsal com ~300 alunos, judô, bocha renovada e metas de energia solar.",
    href: "https://fatopaulista.com.br/fato-paulista-entrevista-presidente-do-elite-itaquerense/",
    externo: true,
    fonte: FP,
  },
  {
    id: "escudo-historico-hdf",
    aba: "clube",
    badge: "Escudo",
    periodo: "1928",
    titulo: "1º distintivo e estatuto de 1928",
    resumo:
      "O site História do Futebol documentou o primeiro distintivo do Elite Itaquerense Foot Ball Club e o estatuto de 1928, com a inscrição “Football Club” em inglês — patrimônio vivo da identidade alvirrubra.",
    imagem: "/landing/galeria/escudo-historico.jpg",
    href: "https://historiadofutebol.com/blog/?p=134731",
    externo: true,
    fonte: HDF,
  },
  {
    id: "museu-futebol",
    aba: "clube",
    badge: "Acervo",
    periodo: "CRFB",
    titulo: "No acervo do Museu do Futebol",
    resumo:
      "A Sociedade Esportiva Elite Itaquerense consta no Centro de Referência do Futebol Brasileiro (Museu do Futebol) como clube de futebol amador fundado em 01/12/1922.",
    href: "https://museudofutebol.org.br/crfb/instituicoes/471220",
    externo: true,
    fonte: MUSEU,
  },
  {
    id: "judo-cresce",
    aba: "clube",
    badge: "Judô",
    periodo: "2025",
    titulo: "Judô do Elite cresce a cada dia",
    resumo:
      "Com o slogan “Elite – Judô para Todos”, a modalidade se notabiliza no clube. Senseis e novas graduações têm sido destaque na cobertura do Fato Paulista.",
    href: "https://fatopaulista.com.br/judo-do-elite-itaquerense-cresce-a-cada-dia/",
    externo: true,
    fonte: FP,
  },
  {
    id: "judo-dojo",
    aba: "clube",
    badge: "Judô",
    periodo: "2025",
    titulo: "Elite inaugura novo dojo",
    resumo:
      "O judô da Sociedade Esportiva Elite Itaquerense, coordenado pelos senseis Fábio Lenci e Salomão Romero, ganhou novo espaço de treino na sede.",
    href: "https://fatopaulista.com.br/elite-itaquerense-inaugura-novo-dojo/",
    externo: true,
    fonte: FP,
  },
  {
    id: "feijoada-samba",
    aba: "clube",
    badge: "Social",
    periodo: "2025",
    titulo: "Feijoada com samba no Elite",
    resumo:
      "A tradicional Feijoada com Samba reuniu famílias que fizeram a história de Itaquera e região — resenha, amizade e a vida social que sempre marcou o clube.",
    href: "https://fatopaulista.com.br/muito-samba-resenha-e-amizade-na-feijoada-do-elite-itaquerense/",
    externo: true,
    fonte: FP,
  },
  {
    id: "bocha-tradicional",
    aba: "clube",
    badge: "Modalidade",
    periodo: "2022",
    titulo: "A tradicional bocha do Elite",
    resumo:
      "A quadra de bocha passou por grande reforma e segue como espaço de convivência e esporte no clube — tradição eliteana relembrada pelo Fato Paulista.",
    href: "https://fatopaulista.com.br/a-tradicional-bocha-do-elite-itaquerense/",
    externo: true,
    fonte: FP,
  },
  {
    id: "serie-100-anos-futsal",
    aba: "clube",
    badge: "Série",
    periodo: "2022",
    titulo: "Série Elite 100 anos: o futsal",
    resumo:
      "Na série sobre o centenário, o Fato Paulista dedicou edição especial ao futsal — Mundial da França, revelações e a filosofia de formar caráter pelo esporte.",
    href: "https://fatopaulista.com.br/futsal-do-elite-orgulha-a-zona-leste-com-conquistas-e-revelando-craques/",
    externo: true,
    fonte: FP,
  },
]

export function materiasPorAba(aba: MateriaAbaId): MateriaCard[] {
  if (aba === "destaques") {
    return MATERIAS.filter((m) => m.destaque)
  }
  if (aba === "publicacoes") return []
  return MATERIAS.filter((m) => m.aba === aba)
}
