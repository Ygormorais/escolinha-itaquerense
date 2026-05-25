-- CreateIndex
CREATE INDEX "Aluno_status_idx" ON "Aluno"("status");

-- CreateIndex
CREATE INDEX "Aluno_turma_idx" ON "Aluno"("turma");

-- CreateIndex
CREATE INDEX "Aluno_status_turma_idx" ON "Aluno"("status", "turma");

-- CreateIndex
CREATE INDEX "Custo_data_idx" ON "Custo"("data");

-- CreateIndex
CREATE INDEX "Frequencia_data_idx" ON "Frequencia"("data");

-- CreateIndex
CREATE INDEX "Frequencia_alunoId_idx" ON "Frequencia"("alunoId");

-- CreateIndex
CREATE INDEX "Pagamento_alunoId_idx" ON "Pagamento"("alunoId");

-- CreateIndex
CREATE INDEX "Pagamento_mesReferencia_idx" ON "Pagamento"("mesReferencia");

-- CreateIndex
CREATE INDEX "Pagamento_dataPagamento_idx" ON "Pagamento"("dataPagamento");

-- CreateIndex
CREATE INDEX "Pagamento_alunoId_mesReferencia_idx" ON "Pagamento"("alunoId", "mesReferencia");
