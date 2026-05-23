-- CreateTable
CREATE TABLE "TransacaoMaquina" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dataTransacao" DATETIME NOT NULL,
    "valor" REAL NOT NULL,
    "parcelas" INTEGER NOT NULL DEFAULT 1,
    "bandeira" TEXT NOT NULL DEFAULT '',
    "tipo" TEXT NOT NULL DEFAULT 'credito',
    "nomeNoCartao" TEXT NOT NULL DEFAULT '',
    "parcela" TEXT,
    "autorizacao" TEXT,
    "nsu" TEXT,
    "custoTaxa" REAL,
    "valorLiquido" REAL,
    "previsao" DATETIME,
    "arquivo" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "alunoId" INTEGER,
    "pagamentoId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TransacaoMaquina_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TransacaoMaquina_pagamentoId_fkey" FOREIGN KEY ("pagamentoId") REFERENCES "Pagamento" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
