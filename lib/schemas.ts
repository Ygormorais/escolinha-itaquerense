import { z } from "zod"

export const AlunoSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  dataNascimento: z.string().min(1, "Data de nascimento obrigatória"),
  turma: z.string().min(1, "Selecione uma turma"),
  horario: z.string().min(1, "Selecione um horário"),
  responsavel: z.string().min(3, "Nome do responsável obrigatório"),
  telefone: z.string().min(8, "Telefone inválido"),
  email: z.string().email("E-mail inválido"),
  dataMatricula: z.string().min(1, "Data de matrícula obrigatória"),
  mensalidade: z.coerce.number().min(1, "Mensalidade deve ser maior que zero"),
  status: z.enum(["Ativo", "Inativo"]),
  observacoes: z.string().optional(),
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
  categoria: z.string().min(1, "Selecione uma categoria"),
  descricao: z.string().min(3, "Descrição deve ter pelo menos 3 caracteres"),
  fornecedor: z.string().min(2, "Fornecedor obrigatório"),
  valor: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
  formaPagamento: z.string().min(1, "Selecione a forma de pagamento"),
  comprovante: z.boolean().default(false),
  observacoes: z.string().optional(),
})

export type CustoFormValues = z.infer<typeof CustoSchema>
