CREATE TABLE "AcaoDesenvolvimento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "alunoId" INTEGER NOT NULL,
    "insightKey" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "observacao" TEXT,
    "usuario" TEXT,
    "concluidaEm" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AcaoDesenvolvimento_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "AcaoDesenvolvimento_insightKey_key" ON "AcaoDesenvolvimento"("insightKey");
CREATE INDEX "AcaoDesenvolvimento_alunoId_status_idx" ON "AcaoDesenvolvimento"("alunoId", "status");
CREATE INDEX "AcaoDesenvolvimento_status_updatedAt_idx" ON "AcaoDesenvolvimento"("status", "updatedAt");
