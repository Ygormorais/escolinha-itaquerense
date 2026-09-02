-- CreateTable
CREATE TABLE "AtividadeTreino" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "objetivo" TEXT NOT NULL,
    "faixa" TEXT NOT NULL,
    "duracaoMin" INTEGER NOT NULL,
    "materiais" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "validadaEm" DATETIME,
    "validadaPor" TEXT,
    "criadaPor" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AtividadeTreinoFavorito" (
    "atividadeId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("atividadeId", "usuarioId"),
    CONSTRAINT "AtividadeTreinoFavorito_atividadeId_fkey" FOREIGN KEY ("atividadeId") REFERENCES "AtividadeTreino" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AtividadeTreinoFavorito_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessaoTreino" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "turma" TEXT NOT NULL,
    "realizadoEm" TEXT NOT NULL,
    "duracaoMin" INTEGER NOT NULL,
    "planoTreinoId" INTEGER,
    "resumo" TEXT NOT NULL,
    "adaptacoes" TEXT,
    "ocorrencias" TEXT,
    "usuario" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SessaoTreino_planoTreinoId_fkey" FOREIGN KEY ("planoTreinoId") REFERENCES "PlanoTreino" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessaoTreinoAtleta" (
    "sessaoId" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,
    PRIMARY KEY ("sessaoId", "alunoId"),
    CONSTRAINT "SessaoTreinoAtleta_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "SessaoTreino" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SessaoTreinoAtleta_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessaoTreinoAcao" (
    "sessaoId" INTEGER NOT NULL,
    "acaoId" INTEGER NOT NULL,
    PRIMARY KEY ("sessaoId", "acaoId"),
    CONSTRAINT "SessaoTreinoAcao_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "SessaoTreino" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SessaoTreinoAcao_acaoId_fkey" FOREIGN KEY ("acaoId") REFERENCES "AcaoDesenvolvimento" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessaoTreinoAtividade" (
    "sessaoId" INTEGER NOT NULL,
    "atividadeId" INTEGER NOT NULL,
    "resultado" TEXT NOT NULL,
    "observacao" TEXT,
    PRIMARY KEY ("sessaoId", "atividadeId"),
    CONSTRAINT "SessaoTreinoAtividade_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "SessaoTreino" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SessaoTreinoAtividade_atividadeId_fkey" FOREIGN KEY ("atividadeId") REFERENCES "AtividadeTreino" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AtividadeTreino_ativa_objetivo_faixa_idx" ON "AtividadeTreino"("ativa", "objetivo", "faixa");
CREATE INDEX "AtividadeTreinoFavorito_usuarioId_idx" ON "AtividadeTreinoFavorito"("usuarioId");
CREATE INDEX "SessaoTreino_turma_realizadoEm_id_idx" ON "SessaoTreino"("turma", "realizadoEm", "id");
CREATE INDEX "SessaoTreino_planoTreinoId_idx" ON "SessaoTreino"("planoTreinoId");
CREATE INDEX "SessaoTreinoAtleta_alunoId_idx" ON "SessaoTreinoAtleta"("alunoId");
CREATE INDEX "SessaoTreinoAcao_acaoId_idx" ON "SessaoTreinoAcao"("acaoId");
CREATE INDEX "SessaoTreinoAtividade_atividadeId_resultado_idx" ON "SessaoTreinoAtividade"("atividadeId", "resultado");
