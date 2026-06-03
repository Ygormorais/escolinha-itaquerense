-- CreateTable
CREATE TABLE "Solicitacao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "responsavelId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "resposta" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Solicitacao_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Responsavel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
