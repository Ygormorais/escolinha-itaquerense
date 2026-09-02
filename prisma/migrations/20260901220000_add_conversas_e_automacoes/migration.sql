-- CreateTable
CREATE TABLE "ConversaFamilia" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "alunoId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "contextoTipo" TEXT NOT NULL,
    "contextoId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'aberta',
    "criadaPor" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ConversaFamilia_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MensagemConversaFamilia" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "conversaId" INTEGER NOT NULL,
    "autorTipo" TEXT NOT NULL,
    "autorIdentificador" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MensagemConversaFamilia_conversaId_fkey" FOREIGN KEY ("conversaId") REFERENCES "ConversaFamilia" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RegraAutomacao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "antecedenciaDias" INTEGER NOT NULL DEFAULT 0,
    "responsavelId" INTEGER NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criadaPor" TEXT NOT NULL,
    "ultimaExecucaoEm" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RegraAutomacao_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExecucaoAutomacao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "regraId" INTEGER NOT NULL,
    "referencia" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExecucaoAutomacao_regraId_fkey" FOREIGN KEY ("regraId") REFERENCES "RegraAutomacao" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ConversaFamilia_alunoId_status_updatedAt_idx" ON "ConversaFamilia"("alunoId", "status", "updatedAt");
CREATE INDEX "ConversaFamilia_contextoTipo_contextoId_idx" ON "ConversaFamilia"("contextoTipo", "contextoId");
CREATE INDEX "MensagemConversaFamilia_conversaId_id_idx" ON "MensagemConversaFamilia"("conversaId", "id");
CREATE INDEX "RegraAutomacao_ativa_tipo_idx" ON "RegraAutomacao"("ativa", "tipo");
CREATE INDEX "RegraAutomacao_responsavelId_idx" ON "RegraAutomacao"("responsavelId");
CREATE UNIQUE INDEX "ExecucaoAutomacao_regraId_referencia_key" ON "ExecucaoAutomacao"("regraId", "referencia");
CREATE INDEX "ExecucaoAutomacao_regraId_createdAt_idx" ON "ExecucaoAutomacao"("regraId", "createdAt");
