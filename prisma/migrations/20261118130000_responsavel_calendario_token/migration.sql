-- Token do feed de calendário (.ics) por responsável; revogável ao gerar outro.
ALTER TABLE "Responsavel" ADD COLUMN "calendarioToken" TEXT;
ALTER TABLE "Responsavel" ADD COLUMN "calendarioTokenCriadoEm" DATETIME;
CREATE UNIQUE INDEX "Responsavel_calendarioToken_key" ON "Responsavel"("calendarioToken");
