CREATE TABLE "RenovacaoMatricula" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "alunoId" INTEGER NOT NULL,
  "responsavelId" INTEGER NOT NULL,
  "periodo" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pendente',
  "observacoes" TEXT,
  "resposta" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RenovacaoMatricula_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RenovacaoMatricula_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Responsavel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "RenovacaoMatricula_alunoId_periodo_key" ON "RenovacaoMatricula"("alunoId", "periodo");
CREATE INDEX "RenovacaoMatricula_responsavelId_idx" ON "RenovacaoMatricula"("responsavelId");
