-- AlterTable
ALTER TABLE "Campeonato" ADD COLUMN "fpfsEventoId" INTEGER;
ALTER TABLE "Campeonato" ADD COLUMN "fpfsSyncEm" DATETIME;
ALTER TABLE "Campeonato" ADD COLUMN "fpfsTimeNome" TEXT;

-- AlterTable
ALTER TABLE "Partida" ADD COLUMN "fpfsJogoId" TEXT;
ALTER TABLE "Partida" ADD COLUMN "sumulaUrl" TEXT;

-- CreateTable
CREATE TABLE "ClassificacaoFpfs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "campeonatoId" INTEGER NOT NULL,
    "fase" TEXT NOT NULL,
    "grupo" TEXT,
    "posicao" INTEGER NOT NULL,
    "timeNome" TEXT NOT NULL,
    "pontos" INTEGER NOT NULL DEFAULT 0,
    "jogos" INTEGER NOT NULL DEFAULT 0,
    "vitorias" INTEGER NOT NULL DEFAULT 0,
    "empates" INTEGER NOT NULL DEFAULT 0,
    "derrotas" INTEGER NOT NULL DEFAULT 0,
    "golsPro" INTEGER NOT NULL DEFAULT 0,
    "golsContra" INTEGER NOT NULL DEFAULT 0,
    "saldo" INTEGER NOT NULL DEFAULT 0,
    "ehNosso" BOOLEAN NOT NULL DEFAULT false,
    "atualizadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClassificacaoFpfs_campeonatoId_fkey" FOREIGN KEY ("campeonatoId") REFERENCES "Campeonato" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ClassificacaoFpfs_campeonatoId_idx" ON "ClassificacaoFpfs"("campeonatoId");

-- CreateIndex
CREATE UNIQUE INDEX "Partida_campeonatoId_fpfsJogoId_key" ON "Partida"("campeonatoId", "fpfsJogoId");
