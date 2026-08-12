-- Acelera consultas de frequência filtradas por mês, semana ou intervalo de datas.
CREATE INDEX "Frequencia_data_idx" ON "Frequencia"("data");
