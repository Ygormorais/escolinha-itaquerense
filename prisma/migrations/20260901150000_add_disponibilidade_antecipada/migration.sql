-- CreateTable
CREATE TABLE "DisponibilidadePartida" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "partidaId" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "responsavelId" INTEGER NOT NULL,
    "resposta" TEXT NOT NULL,
    "motivo" TEXT,
    "respondidoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DisponibilidadePartida_partidaId_fkey" FOREIGN KEY ("partidaId") REFERENCES "Partida" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DisponibilidadePartida_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DisponibilidadePartida_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Responsavel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DisponibilidadeEvento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "eventoId" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "responsavelId" INTEGER NOT NULL,
    "resposta" TEXT NOT NULL,
    "motivo" TEXT,
    "respondidoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DisponibilidadeEvento_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DisponibilidadeEvento_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DisponibilidadeEvento_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Responsavel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DisponibilidadePartida_partidaId_alunoId_key" ON "DisponibilidadePartida"("partidaId", "alunoId");
CREATE INDEX "DisponibilidadePartida_partidaId_resposta_idx" ON "DisponibilidadePartida"("partidaId", "resposta");
CREATE INDEX "DisponibilidadePartida_responsavelId_idx" ON "DisponibilidadePartida"("responsavelId");
CREATE UNIQUE INDEX "DisponibilidadeEvento_eventoId_alunoId_key" ON "DisponibilidadeEvento"("eventoId", "alunoId");
CREATE INDEX "DisponibilidadeEvento_eventoId_resposta_idx" ON "DisponibilidadeEvento"("eventoId", "resposta");
CREATE INDEX "DisponibilidadeEvento_responsavelId_idx" ON "DisponibilidadeEvento"("responsavelId");
