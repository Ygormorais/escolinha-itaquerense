-- Um crédito do extrato (fitid) só pode ter UM recibo ativo: a importação concorrente da mesma
-- transação falha na gravação em vez de creditar duas mensalidades. Recibo cancelado libera o fitid.
-- Índice parcial: o Prisma não o modela no schema, então ele existe só aqui (nunca remover).
CREATE UNIQUE INDEX "Recibo_fitidOfx_ativo_key" ON "Recibo"("fitidOfx") WHERE "fitidOfx" IS NOT NULL AND "canceladoAt" IS NULL;
