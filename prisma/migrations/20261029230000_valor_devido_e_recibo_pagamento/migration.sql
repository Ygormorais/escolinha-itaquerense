-- AlterTable
ALTER TABLE "Pagamento" ADD COLUMN "valorDevido" REAL;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Recibo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero" TEXT NOT NULL,
    "codigoVerificacao" TEXT,
    "hashIntegridade" TEXT,
    "alunoNome" TEXT NOT NULL,
    "responsavel" TEXT NOT NULL,
    "mesReferencia" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "formaPagamento" TEXT NOT NULL,
    "dataPagamento" DATETIME NOT NULL,
    "emitidoPor" TEXT,
    "canceladoAt" DATETIME,
    "canceladoPor" TEXT,
    "pagamentoId" INTEGER,
    "alunoId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Recibo_pagamentoId_fkey" FOREIGN KEY ("pagamentoId") REFERENCES "Pagamento" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Recibo_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Recibo" ("alunoNome", "canceladoAt", "canceladoPor", "codigoVerificacao", "createdAt", "dataPagamento", "emitidoPor", "formaPagamento", "hashIntegridade", "id", "mesReferencia", "numero", "responsavel", "valor") SELECT "alunoNome", "canceladoAt", "canceladoPor", "codigoVerificacao", "createdAt", "dataPagamento", "emitidoPor", "formaPagamento", "hashIntegridade", "id", "mesReferencia", "numero", "responsavel", "valor" FROM "Recibo";
DROP TABLE "Recibo";
ALTER TABLE "new_Recibo" RENAME TO "Recibo";
CREATE UNIQUE INDEX "Recibo_numero_key" ON "Recibo"("numero");
CREATE UNIQUE INDEX "Recibo_codigoVerificacao_key" ON "Recibo"("codigoVerificacao");
CREATE INDEX "Recibo_pagamentoId_idx" ON "Recibo"("pagamentoId");
CREATE INDEX "Recibo_alunoId_idx" ON "Recibo"("alunoId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Preenche o valor devido das mensalidades existentes com o valor atual do aluno.
UPDATE "Pagamento" SET "valorDevido" = (
  SELECT MAX(0, "Aluno"."mensalidade" - "Aluno"."desconto") FROM "Aluno" WHERE "Aluno"."id" = "Pagamento"."alunoId"
) WHERE "valorDevido" IS NULL;
