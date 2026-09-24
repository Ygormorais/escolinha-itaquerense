-- Índices compostos para consultas por aluno em relatório/dashboard
-- (evita full scan ao filtrar Pagamento/Frequencia por alunoId + intervalo de data)
CREATE INDEX "Pagamento_alunoId_dataPagamento_dataVencimento_idx" ON "Pagamento"("alunoId", "dataPagamento", "dataVencimento");
CREATE INDEX "Frequencia_alunoId_data_idx" ON "Frequencia"("alunoId", "data");
