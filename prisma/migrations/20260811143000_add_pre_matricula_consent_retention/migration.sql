ALTER TABLE "PreMatricula" ADD COLUMN "consentimentoEm" DATETIME;
ALTER TABLE "PreMatricula" ADD COLUMN "consentimentoVersao" TEXT;
ALTER TABLE "PreMatricula" ADD COLUMN "decididoEm" DATETIME;

CREATE INDEX "PreMatricula_decididoEm_idx" ON "PreMatricula"("decididoEm");
