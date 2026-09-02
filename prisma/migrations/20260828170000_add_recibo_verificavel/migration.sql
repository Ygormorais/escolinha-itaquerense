ALTER TABLE "Recibo" ADD COLUMN "codigoVerificacao" TEXT;
ALTER TABLE "Recibo" ADD COLUMN "hashIntegridade" TEXT;
ALTER TABLE "Recibo" ADD COLUMN "emitidoPor" TEXT;
ALTER TABLE "Recibo" ADD COLUMN "canceladoAt" DATETIME;
ALTER TABLE "Recibo" ADD COLUMN "canceladoPor" TEXT;

UPDATE "Recibo"
SET "codigoVerificacao" = 'LEG-' || printf('%08d', "id")
WHERE "codigoVerificacao" IS NULL;

CREATE UNIQUE INDEX "Recibo_codigoVerificacao_key" ON "Recibo"("codigoVerificacao");
