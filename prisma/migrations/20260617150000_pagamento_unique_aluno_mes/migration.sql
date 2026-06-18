-- Garante uma única mensalidade por (aluno, mês) — fecha a corrida de cobrança
-- em dobro entre o cron e a geração manual.
CREATE UNIQUE INDEX "Pagamento_alunoId_mesReferencia_key" ON "Pagamento"("alunoId", "mesReferencia");
