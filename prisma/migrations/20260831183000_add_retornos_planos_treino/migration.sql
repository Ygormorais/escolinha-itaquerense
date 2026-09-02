CREATE TABLE "RetornoPlanoTreino" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "planoId" INTEGER NOT NULL,
  "aplicadoEm" TEXT NOT NULL,
  "resultado" TEXT NOT NULL,
  "observacao" TEXT NOT NULL,
  "usuario" TEXT NOT NULL,
  "chave" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RetornoPlanoTreino_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "PlanoTreino" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "RetornoPlanoTreino_chave_key" ON "RetornoPlanoTreino"("chave");
CREATE INDEX "RetornoPlanoTreino_planoId_id_idx" ON "RetornoPlanoTreino"("planoId", "id");
