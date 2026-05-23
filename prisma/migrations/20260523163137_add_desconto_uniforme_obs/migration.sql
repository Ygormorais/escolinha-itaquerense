-- AlterTable
ALTER TABLE "Pagamento" ADD COLUMN "observacoes" TEXT;

-- CreateTable
CREATE TABLE "Uniforme" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "alunoId" INTEGER NOT NULL,
    "item" TEXT NOT NULL,
    "tamanho" TEXT,
    "entregue" BOOLEAN NOT NULL DEFAULT false,
    "dataEntrega" DATETIME,
    "observacoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Uniforme_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Aluno" (
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
    "desconto" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "observacoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Aluno" ("createdAt", "dataMatricula", "dataNascimento", "email", "horario", "id", "mensalidade", "nome", "observacoes", "responsavel", "status", "telefone", "turma") SELECT "createdAt", "dataMatricula", "dataNascimento", "email", "horario", "id", "mensalidade", "nome", "observacoes", "responsavel", "status", "telefone", "turma" FROM "Aluno";
DROP TABLE "Aluno";
ALTER TABLE "new_Aluno" RENAME TO "Aluno";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
