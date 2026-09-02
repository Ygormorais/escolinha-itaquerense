-- CreateTable
CREATE TABLE "CicloAutomacao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "regraId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "encontrados" INTEGER NOT NULL DEFAULT 0,
    "criados" INTEGER NOT NULL DEFAULT 0,
    "erro" TEXT,
    "iniciadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizadoEm" DATETIME,
    CONSTRAINT "CicloAutomacao_regraId_fkey" FOREIGN KEY ("regraId") REFERENCES "RegraAutomacao" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TratamentoPendencia" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "chave" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'aberta',
    "responsavel" TEXT,
    "adiadaAte" DATETIME,
    "observacao" TEXT,
    "alteradaPor" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "CicloAutomacao_regraId_iniciadoEm_idx" ON "CicloAutomacao"("regraId", "iniciadoEm");
CREATE INDEX "CicloAutomacao_status_iniciadoEm_idx" ON "CicloAutomacao"("status", "iniciadoEm");
CREATE UNIQUE INDEX "TratamentoPendencia_chave_key" ON "TratamentoPendencia"("chave");
CREATE INDEX "TratamentoPendencia_status_adiadaAte_idx" ON "TratamentoPendencia"("status", "adiadaAte");
CREATE INDEX "TratamentoPendencia_responsavel_status_idx" ON "TratamentoPendencia"("responsavel", "status");
