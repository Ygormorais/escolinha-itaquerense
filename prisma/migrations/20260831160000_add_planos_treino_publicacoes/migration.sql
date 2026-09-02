CREATE TABLE "PlanoTreino" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "turma" TEXT NOT NULL,
  "preferencias" TEXT NOT NULL,
  "texto" TEXT NOT NULL,
  "usuario" TEXT NOT NULL,
  "chave" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "PlanoTreino_chave_key" ON "PlanoTreino"("chave");
CREATE INDEX "PlanoTreino_turma_id_idx" ON "PlanoTreino"("turma", "id");

CREATE TABLE "PublicacaoResumo" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "resumoId" INTEGER NOT NULL,
  "responsavelId" INTEGER NOT NULL,
  "publicadoPor" TEXT NOT NULL,
  "publicadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "retiradoEm" DATETIME,
  "lidoEm" DATETIME,
  CONSTRAINT "PublicacaoResumo_resumoId_fkey" FOREIGN KEY ("resumoId") REFERENCES "ResumoFamiliar" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PublicacaoResumo_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Responsavel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PublicacaoResumo_resumoId_key" ON "PublicacaoResumo"("resumoId");
CREATE INDEX "PublicacaoResumo_responsavelId_id_idx" ON "PublicacaoResumo"("responsavelId", "id");
