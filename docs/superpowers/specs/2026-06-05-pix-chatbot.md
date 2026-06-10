# PIX Direto no Chatbot WhatsApp — Spec

**Data:** 2026-06-05  
**Status:** Aprovado

## Objetivo
Quando responsável pergunta sobre mensalidade no WhatsApp, o bot responde automaticamente com o PIX copia-e-cola do mês atual.

## Fluxo
1. Responsável envia mensagem com intenção de pagamento ("como pago?", "boleto", "pix", "mensalidade")
2. Claude detecta intenção → chama tool `obterPixMensalidade`
3. Tool busca pagamento do mês corrente para o aluno vinculado ao responsável:
   - **Já tem PIX emitido e pendente** → retorna copia-e-cola existente
   - **Sem cobrança emitida** → chama `emitirCobranca(id, "PIX")` → retorna novo copia-e-cola
   - **Já pago** → informa que o mês está quite
   - **Múltiplos alunos** → responde para cada aluno separadamente
4. Bot formata resposta com: nome do aluno, mês referência, valor, copia-e-cola, instrução

## Implementação

### Nova tool `obterPixMensalidade` em `lib/whatsapp/tools.ts`
```
Input: { responsavelId }
Output: { alunos: [{ nome, mes, valor, pixCopiaECola, status }] }
```
- Busca alunos do responsável
- Para cada aluno: busca `Pagamento` do mês atual (`mesReferencia = "YYYY-MM"`)
- Se `dataPagamento != null` → status "pago"
- Se `pixCopiaECola != null && statusCobranca == "pendente"` → retorna existente
- Senão → chama `emitirCobranca` internamente

### Mensagem de resposta (template)
```
💰 Mensalidade de [NOME] — [MÊS]
Valor: R$ [VALOR]

PIX Copia e Cola:
[CÓDIGO]

Válido por 3 dias. Após o pagamento, a confirmação é automática! ✅
```

### Intenções detectadas pelo Claude
Palavras-chave adicionadas ao system prompt: pix, boleto, pagar, mensalidade, cobrança, vencimento, quanto devo.

## Segurança
- Tool só acessa dados do `responsavelId` autenticado na sessão
- `emitirCobranca` já tem `requireAuth` — chamada interna usa contexto do bot (bypass necessário com flag `{ internal: true }`)
