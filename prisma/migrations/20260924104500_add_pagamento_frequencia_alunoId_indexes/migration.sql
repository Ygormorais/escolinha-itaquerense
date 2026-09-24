-- Índice composto para consultas por aluno em relatório/dashboard
-- (evita full scan ao filtrar Pagamento por alunoId + intervalo de data).
-- Frequencia não precisa de índice equivalente: @@unique([alunoId, data])
-- já cobre o mesmo padrão de consulta.
CREATE INDEX "Pagamento_alunoId_dataPagamento_dataVencimento_idx" ON "Pagamento"("alunoId", "dataPagamento", "dataVencimento");
