-- Guarda o id da transação OFX no recibo para não usar o mesmo crédito em duas importações.
ALTER TABLE "Recibo" ADD COLUMN "fitidOfx" TEXT;
CREATE INDEX "Recibo_fitidOfx_idx" ON "Recibo"("fitidOfx");
