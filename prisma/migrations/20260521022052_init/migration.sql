-- CreateTable
CREATE TABLE "Aluno" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "dataNascimento" DATETIME NOT NULL,
    "turma" TEXT NOT NULL,
    "horario" TEXT NOT NULL,
    "responsavel" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "dataMatricula" DATETIME NOT NULL,
    "mensalidade" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "observacoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Pagamento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "alunoId" INTEGER NOT NULL,
    "mesReferencia" TEXT NOT NULL,
    "dataVencimento" DATETIME NOT NULL,
    "dataPagamento" DATETIME,
    "formaPagamento" TEXT,
    "valorRecebido" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Pagamento_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Custo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "data" DATETIME NOT NULL,
    "categoria" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "fornecedor" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "formaPagamento" TEXT NOT NULL,
    "comprovante" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Frequencia" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "alunoId" INTEGER NOT NULL,
    "data" DATETIME NOT NULL,
    "presenca" TEXT NOT NULL,
    CONSTRAINT "Frequencia_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Frequencia_alunoId_data_key" ON "Frequencia"("alunoId", "data");
