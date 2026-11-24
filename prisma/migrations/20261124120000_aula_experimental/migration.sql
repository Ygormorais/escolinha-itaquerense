-- CreateTable
CREATE TABLE "JanelaAulaExperimental" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "turma" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "hora" TEXT NOT NULL,
    "duracaoMin" INTEGER NOT NULL DEFAULT 60,
    "local" TEXT,
    "capacidade" INTEGER NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AulaExperimental" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "janelaId" INTEGER NOT NULL,
    "nomeAtleta" TEXT NOT NULL,
    "dataNascimento" DATETIME NOT NULL,
    "nomeResponsavel" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'agendada',
    "consentimentoEm" DATETIME NOT NULL,
    "consentimentoVersao" TEXT NOT NULL,
    "preMatriculaId" INTEGER,
    "lembreteEnviadoEm" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AulaExperimental_janelaId_fkey" FOREIGN KEY ("janelaId") REFERENCES "JanelaAulaExperimental" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "JanelaAulaExperimental_ativa_data_idx" ON "JanelaAulaExperimental"("ativa", "data");

-- CreateIndex
CREATE INDEX "JanelaAulaExperimental_turma_idx" ON "JanelaAulaExperimental"("turma");

-- CreateIndex
CREATE INDEX "AulaExperimental_janelaId_status_idx" ON "AulaExperimental"("janelaId", "status");

-- CreateIndex
CREATE INDEX "AulaExperimental_status_createdAt_idx" ON "AulaExperimental"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AulaExperimental_telefone_idx" ON "AulaExperimental"("telefone");
