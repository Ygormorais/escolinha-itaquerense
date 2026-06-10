-- Indexes para Custo (consultado por data em relatorios e dashboard)
CREATE INDEX IF NOT EXISTS "Custo_data_idx" ON "Custo"("data");
CREATE INDEX IF NOT EXISTS "Custo_categoria_idx" ON "Custo"("categoria");

-- Indexes para TransacaoMaquina (consultado por status e data)
CREATE INDEX IF NOT EXISTS "TransacaoMaquina_status_idx" ON "TransacaoMaquina"("status");
CREATE INDEX IF NOT EXISTS "TransacaoMaquina_dataTransacao_idx" ON "TransacaoMaquina"("dataTransacao");
