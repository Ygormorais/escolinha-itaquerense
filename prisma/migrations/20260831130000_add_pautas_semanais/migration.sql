CREATE TABLE "PautaSemanal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "turma" TEXT NOT NULL,
    "cicloInicio" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "PautaSemanal_chave_key" ON "PautaSemanal"("chave");
CREATE INDEX "PautaSemanal_turma_id_idx" ON "PautaSemanal"("turma", "id");
