-- CreateTable
CREATE TABLE "Produto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "preco" REAL NOT NULL DEFAULT 0,
    "categoria" TEXT NOT NULL DEFAULT 'uniforme',
    "tamanhos" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "imagem" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Avaliacao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "alunoId" INTEGER NOT NULL,
    "periodo" TEXT NOT NULL,
    "notaTecnica" REAL,
    "notaFisica" REAL,
    "notaComportamento" REAL,
    "frequencia" REAL,
    "observacoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Avaliacao_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Evento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "data" DATETIME NOT NULL,
    "horaInicio" TEXT,
    "horaFim" TEXT,
    "local" TEXT,
    "turmas" TEXT,
    "descricao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Evento" ("createdAt", "data", "descricao", "horaFim", "horaInicio", "id", "local", "tipo", "titulo", "turmas") SELECT "createdAt", "data", "descricao", "horaFim", "horaInicio", "id", "local", "tipo", "titulo", "turmas" FROM "Evento";
DROP TABLE "Evento";
ALTER TABLE "new_Evento" RENAME TO "Evento";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Avaliacao_alunoId_periodo_key" ON "Avaliacao"("alunoId", "periodo");
