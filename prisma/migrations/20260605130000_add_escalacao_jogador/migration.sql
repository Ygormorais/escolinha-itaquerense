-- CreateTable
CREATE TABLE "EscalacaoJogador" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "partidaId" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "posicao" TEXT NOT NULL,
    "numero" INTEGER,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EscalacaoJogador_partidaId_fkey" FOREIGN KEY ("partidaId") REFERENCES "Partida" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EscalacaoJogador_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "EscalacaoJogador_partidaId_idx" ON "EscalacaoJogador"("partidaId");

-- CreateIndex
CREATE UNIQUE INDEX "EscalacaoJogador_partidaId_alunoId_key" ON "EscalacaoJogador"("partidaId", "alunoId");
