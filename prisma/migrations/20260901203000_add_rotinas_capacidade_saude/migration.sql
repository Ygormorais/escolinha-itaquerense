-- AlterTable
ALTER TABLE "Aluno" ADD COLUMN "fichaMedicaVersao" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "RotinaOperacional" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "frequencia" TEXT NOT NULL,
    "diaSemana" INTEGER,
    "diaMes" INTEGER,
    "responsavelId" INTEGER,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criadaPor" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RotinaOperacional_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RotinaOcorrencia" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rotinaId" INTEGER NOT NULL,
    "referencia" TEXT NOT NULL,
    "vencimento" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "concluidaPorId" INTEGER,
    "observacao" TEXT,
    "concluidaEm" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RotinaOcorrencia_rotinaId_fkey" FOREIGN KEY ("rotinaId") REFERENCES "RotinaOperacional" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RotinaOcorrencia_concluidaPorId_fkey" FOREIGN KEY ("concluidaPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConfiguracaoTurma" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "capacidade" INTEGER NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ListaEsperaTurma" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "turmaId" INTEGER NOT NULL,
    "nomeAluno" TEXT NOT NULL,
    "responsavel" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'aguardando',
    "observacao" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ListaEsperaTurma_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "ConfiguracaoTurma" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FichaMedicaLeitura" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "alunoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "versao" INTEGER NOT NULL,
    "lidaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FichaMedicaLeitura_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FichaMedicaLeitura_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "RotinaOperacional_ativa_frequencia_idx" ON "RotinaOperacional"("ativa", "frequencia");
CREATE INDEX "RotinaOperacional_responsavelId_idx" ON "RotinaOperacional"("responsavelId");
CREATE UNIQUE INDEX "RotinaOcorrencia_rotinaId_referencia_key" ON "RotinaOcorrencia"("rotinaId", "referencia");
CREATE INDEX "RotinaOcorrencia_status_vencimento_idx" ON "RotinaOcorrencia"("status", "vencimento");
CREATE INDEX "RotinaOcorrencia_concluidaPorId_idx" ON "RotinaOcorrencia"("concluidaPorId");
CREATE UNIQUE INDEX "ConfiguracaoTurma_nome_key" ON "ConfiguracaoTurma"("nome");
CREATE INDEX "ConfiguracaoTurma_ativa_nome_idx" ON "ConfiguracaoTurma"("ativa", "nome");
CREATE INDEX "ListaEsperaTurma_turmaId_status_createdAt_idx" ON "ListaEsperaTurma"("turmaId", "status", "createdAt");
CREATE UNIQUE INDEX "FichaMedicaLeitura_alunoId_usuarioId_versao_key" ON "FichaMedicaLeitura"("alunoId", "usuarioId", "versao");
CREATE INDEX "FichaMedicaLeitura_usuarioId_lidaEm_idx" ON "FichaMedicaLeitura"("usuarioId", "lidaEm");
