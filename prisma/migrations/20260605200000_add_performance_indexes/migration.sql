-- Indexes de performance para queries frequentes em producao

-- Pagamento: webhook MP busca por externalId; relatorios filtram por mesReferencia/dataPagamento
CREATE INDEX IF NOT EXISTS "Pagamento_alunoId_idx" ON "Pagamento"("alunoId");
CREATE INDEX IF NOT EXISTS "Pagamento_mesReferencia_idx" ON "Pagamento"("mesReferencia");
CREATE INDEX IF NOT EXISTS "Pagamento_dataPagamento_idx" ON "Pagamento"("dataPagamento");
CREATE INDEX IF NOT EXISTS "Pagamento_statusCobranca_idx" ON "Pagamento"("statusCobranca");
CREATE INDEX IF NOT EXISTS "Pagamento_externalId_idx" ON "Pagamento"("externalId");

-- Aluno: listagem filtra por status (Ativo/Inativo) e turma com frequencia
CREATE INDEX IF NOT EXISTS "Aluno_status_idx" ON "Aluno"("status");
CREATE INDEX IF NOT EXISTS "Aluno_turma_idx" ON "Aluno"("turma");

-- Log: historico filtra por tipo e ordena por data
CREATE INDEX IF NOT EXISTS "Log_tipo_idx" ON "Log"("tipo");
CREATE INDEX IF NOT EXISTS "Log_createdAt_idx" ON "Log"("createdAt");
