import { z } from "zod"

export const AlunoSchema = z.object({
  nome: z.string().trim().min(3, "Nome deve ter pelo menos 3 caracteres").max(120, "Nome muito longo"),
  dataNascimento: z.string().min(1, "Data de nascimento obrigatória"),
  turma: z.string().min(1, "Selecione uma turma"),
  horario: z.string().min(1, "Selecione um horário"),
  responsavel: z.string().min(3, "Nome do responsável obrigatório").max(120, "Nome muito longo"),
  telefone: z.string().min(8, "Telefone inválido").max(20, "Telefone inválido"),
  email: z.union([z.string().email("E-mail inválido"), z.literal("")]),
  dataMatricula: z.string().min(1, "Data de matrícula obrigatória"),
  mensalidade: z.coerce.number().min(0, "Mensalidade inválida"),
  desconto: z.coerce.number().min(0).optional(),
  status: z.enum(["Ativo", "Inativo"]),
  posicao: z.string().max(50).nullable().optional(),
  observacoes: z.string().max(2000).optional(),
})

export type AlunoFormValues = z.infer<typeof AlunoSchema>

export const PagamentoSchema = z.object({
  dataPagamento: z.string().min(1, "Data obrigatória"),
  formaPagamento: z.string().min(1, "Selecione a forma de pagamento"),
  valorRecebido: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
})

export type PagamentoFormValues = z.infer<typeof PagamentoSchema>

export const CustoSchema = z.object({
  data: z.string().min(1, "Data obrigatória"),
  categoria: z.string().min(1, "Selecione uma categoria").max(80),
  descricao: z.string().min(3, "Descrição deve ter pelo menos 3 caracteres").max(300),
  fornecedor: z.string().min(2, "Fornecedor obrigatório").max(120),
  valor: z
    .any()
    .transform((v) => Number(v))
    .refine((v) => Number.isFinite(v) && v > 0, "Valor inválido"),
  formaPagamento: z.string().min(1, "Selecione a forma de pagamento").max(60),
  comprovante: z.boolean().default(false),
  observacoes: z.string().max(2000).optional(),
})

export type CustoFormValues = z.infer<typeof CustoSchema>

export const NoticiaSchema = z.object({
  titulo: z.string().min(3, "Título muito curto").max(200, "Título muito longo"),
  subtitulo: z.string().max(400).optional(),
  categoria: z.string().min(1, "Selecione uma categoria").max(80),
  imagemUrl: z.string().url("URL inválida").max(500).optional().or(z.literal("")),
  publicado: z.boolean(),
  destaque: z.boolean(),
})

export type NoticiaFormValues = z.infer<typeof NoticiaSchema>

export const ProdutoSchema = z.object({
  nome: z.string().min(2, "Nome obrigatório").max(120),
  descricao: z.string().max(1000).optional(),
  preco: z.coerce.number().min(0, "Preço inválido"),
  categoria: z.string().max(80).optional(),
  tamanhos: z.string().max(200).optional(),
  estoque: z.coerce.number().int().min(0, "Estoque inválido").optional(),
  ativo: z.boolean().optional(),
  imagem: z.string().url("URL inválida").max(500).optional().or(z.literal("")).optional(),
})

export type ProdutoFormValues = z.infer<typeof ProdutoSchema>
