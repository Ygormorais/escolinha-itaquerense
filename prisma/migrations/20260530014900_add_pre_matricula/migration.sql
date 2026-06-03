-- CreateTable
CREATE TABLE "PreMatricula" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nomeAluno" TEXT NOT NULL,
    "dataNascimento" DATETIME NOT NULL,
    "turma" TEXT NOT NULL,
    "horario" TEXT NOT NULL,
    "nomeResponsavel" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "documentos" TEXT,
    "observacoes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
