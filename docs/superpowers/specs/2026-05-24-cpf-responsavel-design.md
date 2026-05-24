# CPF no Admin de Responsáveis — Design Spec
**Data:** 2026-05-24
**Status:** Aprovado

## Objetivo

Permitir que o admin preencha o CPF dos responsáveis já cadastrados, campo necessário para identificação no chatbot WhatsApp.

---

## Arquitetura

Mudanças cirúrgicas em 2 arquivos existentes:

| Arquivo | Ação |
|---------|------|
| `app/configuracoes/responsaveis/responsaveis-client.tsx` | Adicionar campo CPF no dialog de edição + coluna na tabela |
| `app/actions/responsaveis.ts` | Extender `editarResponsavel` para aceitar `cpf?: string` com validação de unicidade |

---

## Campo no Form de Edição

- Campo CPF adicionado entre Telefone e Status no dialog de edição existente
- Máscara visual `000.000.000-00` no frontend (formatação apenas — salva sem pontuação no banco)
- Campo opcional — responsáveis existentes podem não ter CPF ainda
- Validação: se preenchido, deve ter exatamente 11 dígitos numéricos
- Mensagem de erro inline se CPF já estiver em uso por outro responsável

---

## Server Action

Extender `editarResponsavel` em `app/actions/responsaveis.ts`:

```typescript
editarResponsavel(id: number, data: {
  nome?: string
  email?: string
  telefone?: string
  ativo?: boolean
  cpf?: string | null  // null = limpar CPF
})
```

- Se `cpf` fornecido: verificar se outro `Responsavel` já usa aquele CPF (`findFirst({ where: { cpf, NOT: { id } } })`)
- Se duplicado: retornar `{ error: "CPF já cadastrado para outro responsável" }`
- Sanitizar: remover pontuação antes de salvar (`cpf.replace(/\D/g, "")`)
- Chamar `revalidatePath("/configuracoes/responsaveis")`

---

## Tabela

- Nova coluna **CPF** na listagem entre Contato e Alunos
- Se preenchido: exibe formatado (`000.000.000-00`)
- Se vazio: badge cinza "sem CPF" para facilitar identificação dos pendentes

---

## Fora de Escopo

- Validação de CPF real (algoritmo de dígitos verificadores) — não necessário para MVP
- Importação em lote de CPFs
- Exibir CPF no portal do responsável
