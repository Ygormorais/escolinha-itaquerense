export type Produto = {
  id: number
  nome: string
  descricao: string | null
  preco: number
  categoria: string
  tamanhos: string | null
  estoque: number
  ativo: boolean
  imagem: string | null
  createdAt: Date
}

export type Movimento = {
  id: number
  tipo: string
  quantidade: number
  motivo: string | null
  createdAt: Date
}

export type ProdutoForm = {
  nome: string
  descricao: string
  preco: string
  categoria: string
  tamanhos: string
  estoque: string
  ativo: boolean
  imagem: string
}

export const defaultForm: ProdutoForm = {
  nome: "",
  descricao: "",
  preco: "",
  categoria: "uniforme",
  tamanhos: "",
  estoque: "0",
  ativo: true,
  imagem: "",
}

export const categoriaLabel: Record<string, string> = {
  uniforme: "Uniforme",
  acessorio: "Acessório",
  outro: "Outro",
}

export function rotuloCategoria(categoria: string) {
  return categoriaLabel[categoria] ?? categoria
}

export function formDoProduto(p: Produto): ProdutoForm {
  return {
    nome: p.nome,
    descricao: p.descricao ?? "",
    preco: String(p.preco),
    categoria: p.categoria,
    tamanhos: p.tamanhos ?? "",
    estoque: String(p.estoque),
    ativo: p.ativo,
    imagem: p.imagem ?? "",
  }
}

/** Converte o formulário (tudo texto) no payload das actions; campos vazios viram `undefined`. */
export function dadosDoProduto(form: ProdutoForm) {
  return {
    nome: form.nome,
    descricao: form.descricao || undefined,
    preco: Number(form.preco),
    categoria: form.categoria || undefined,
    tamanhos: form.tamanhos || undefined,
    estoque: Number(form.estoque),
    ativo: form.ativo,
    imagem: form.imagem || undefined,
  }
}
