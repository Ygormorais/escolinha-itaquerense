-- CreateTable
CREATE TABLE "Campeonato" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "dataInicio" DATETIME NOT NULL,
    "dataFim" DATETIME,
    "local" TEXT,
    "taxaInscricao" REAL NOT NULL DEFAULT 0,
    "taxaJogo" REAL NOT NULL DEFAULT 0,
    "taxaArbitragem" REAL NOT NULL DEFAULT 0,
    "custoTransporte" REAL NOT NULL DEFAULT 0,
    "custoUniforme" REAL NOT NULL DEFAULT 0,
    "observacoes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'aberto',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "InscricaoCampeonato" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "campeonatoId" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "bolsa" BOOLEAN NOT NULL DEFAULT false,
    "desconto" REAL NOT NULL DEFAULT 0,
    "taxaPaga" BOOLEAN NOT NULL DEFAULT false,
    "valorPago" REAL,
    "dataPagamento" DATETIME,
    "formaPagamento" TEXT,
    "observacoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InscricaoCampeonato_campeonatoId_fkey" FOREIGN KEY ("campeonatoId") REFERENCES "Campeonato" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InscricaoCampeonato_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "InscricaoCampeonato_campeonatoId_alunoId_key" ON "InscricaoCampeonato"("campeonatoId", "alunoId");
