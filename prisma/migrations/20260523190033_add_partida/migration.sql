-- CreateTable
CREATE TABLE "Partida" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "campeonatoId" INTEGER NOT NULL,
    "rodada" INTEGER NOT NULL DEFAULT 1,
    "data" DATETIME NOT NULL,
    "adversario" TEXT NOT NULL,
    "local" TEXT NOT NULL DEFAULT 'Casa',
    "golsPro" INTEGER,
    "golsContra" INTEGER,
    "resultado" TEXT,
    "observacoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Partida_campeonatoId_fkey" FOREIGN KEY ("campeonatoId") REFERENCES "Campeonato" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
