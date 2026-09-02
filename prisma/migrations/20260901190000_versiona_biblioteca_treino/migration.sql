-- AlterTable
ALTER TABLE "AtividadeTreino" ADD COLUMN "versaoAtual" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "AtividadeTreino" ADD COLUMN "arquivadaEm" DATETIME;
ALTER TABLE "AtividadeTreino" ADD COLUMN "arquivadaPor" TEXT;

-- CreateTable
CREATE TABLE "AtividadeTreinoVersao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "atividadeId" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "objetivo" TEXT NOT NULL,
    "faixa" TEXT NOT NULL,
    "duracaoMin" INTEGER NOT NULL,
    "materiais" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "validadaEm" DATETIME,
    "validadaPor" TEXT,
    "criadaPor" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AtividadeTreinoVersao_atividadeId_fkey" FOREIGN KEY ("atividadeId") REFERENCES "AtividadeTreino" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Seed version 1 for existing activities
INSERT INTO "AtividadeTreinoVersao" ("atividadeId", "numero", "titulo", "descricao", "objetivo", "faixa", "duracaoMin", "materiais", "tags", "validadaEm", "validadaPor", "criadaPor", "createdAt")
SELECT "id", 1, "titulo", "descricao", "objetivo", "faixa", "duracaoMin", "materiais", "tags", "validadaEm", "validadaPor", "criadaPor", "createdAt" FROM "AtividadeTreino";

-- AlterTable: SQLite requires a table rebuild to add this foreign key.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SessaoTreinoAtividade" (
    "sessaoId" INTEGER NOT NULL,
    "atividadeId" INTEGER NOT NULL,
    "atividadeVersaoId" INTEGER,
    "resultado" TEXT NOT NULL,
    "observacao" TEXT,
    PRIMARY KEY ("sessaoId", "atividadeId"),
    CONSTRAINT "SessaoTreinoAtividade_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "SessaoTreino" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SessaoTreinoAtividade_atividadeId_fkey" FOREIGN KEY ("atividadeId") REFERENCES "AtividadeTreino" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SessaoTreinoAtividade_atividadeVersaoId_fkey" FOREIGN KEY ("atividadeVersaoId") REFERENCES "AtividadeTreinoVersao" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SessaoTreinoAtividade" ("sessaoId", "atividadeId", "atividadeVersaoId", "resultado", "observacao")
SELECT s."sessaoId", s."atividadeId", v."id", s."resultado", s."observacao"
FROM "SessaoTreinoAtividade" s
LEFT JOIN "AtividadeTreinoVersao" v ON v."atividadeId" = s."atividadeId" AND v."numero" = 1;
DROP TABLE "SessaoTreinoAtividade";
ALTER TABLE "new_SessaoTreinoAtividade" RENAME TO "SessaoTreinoAtividade";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "AtividadeTreinoVersao_atividadeId_numero_key" ON "AtividadeTreinoVersao"("atividadeId", "numero");
CREATE INDEX "AtividadeTreinoVersao_atividadeId_id_idx" ON "AtividadeTreinoVersao"("atividadeId", "id");
CREATE INDEX "SessaoTreinoAtividade_atividadeId_resultado_idx" ON "SessaoTreinoAtividade"("atividadeId", "resultado");
CREATE INDEX "SessaoTreinoAtividade_atividadeVersaoId_idx" ON "SessaoTreinoAtividade"("atividadeVersaoId");
