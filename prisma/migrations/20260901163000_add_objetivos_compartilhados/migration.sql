-- CreateTable
CREATE TABLE "ObjetivoCompartilhado" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "alunoId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "prazo" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'proposto',
    "respostaFamilia" TEXT,
    "confirmadoEm" DATETIME,
    "encerradoEm" DATETIME,
    "criadoPor" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ObjetivoCompartilhado_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ObjetivoCompartilhado_alunoId_status_idx" ON "ObjetivoCompartilhado"("alunoId", "status");
CREATE INDEX "ObjetivoCompartilhado_prazo_idx" ON "ObjetivoCompartilhado"("prazo");
