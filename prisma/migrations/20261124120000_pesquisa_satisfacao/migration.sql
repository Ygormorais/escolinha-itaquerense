-- CreateTable
CREATE TABLE "PesquisaSatisfacao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "pergunta" TEXT NOT NULL,
    "inicio" DATETIME NOT NULL,
    "fim" DATETIME NOT NULL,
    "encerradaEm" DATETIME,
    "lembrete" BOOLEAN NOT NULL DEFAULT false,
    "lembreteEnviadoEm" DATETIME,
    "criadoPor" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RespostaSatisfacao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pesquisaId" INTEGER NOT NULL,
    "responsavelId" INTEGER NOT NULL,
    "nota" INTEGER NOT NULL,
    "comentario" TEXT,
    "turmas" TEXT NOT NULL DEFAULT '',
    "anonimo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RespostaSatisfacao_pesquisaId_fkey" FOREIGN KEY ("pesquisaId") REFERENCES "PesquisaSatisfacao" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RespostaSatisfacao_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Responsavel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PesquisaSatisfacao_inicio_fim_idx" ON "PesquisaSatisfacao"("inicio", "fim");

-- CreateIndex
CREATE INDEX "RespostaSatisfacao_pesquisaId_nota_idx" ON "RespostaSatisfacao"("pesquisaId", "nota");

-- CreateIndex
CREATE UNIQUE INDEX "RespostaSatisfacao_pesquisaId_responsavelId_key" ON "RespostaSatisfacao"("pesquisaId", "responsavelId");

