-- AlterTable
ALTER TABLE "AcaoDesenvolvimento" ADD COLUMN "responsavelId" INTEGER REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AcaoDesenvolvimento" ADD COLUMN "prazo" TEXT;
ALTER TABLE "AcaoDesenvolvimento" ADD COLUMN "prioridade" TEXT NOT NULL DEFAULT 'media';
ALTER TABLE "AcaoDesenvolvimento" ADD COLUMN "andamento" TEXT NOT NULL DEFAULT 'planejada';
ALTER TABLE "AcaoDesenvolvimento" ADD COLUMN "impedimento" TEXT;
ALTER TABLE "AcaoDesenvolvimento" ADD COLUMN "planoTreinoId" INTEGER REFERENCES "PlanoTreino"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "AcaoDesenvolvimentoComentario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "acaoId" INTEGER NOT NULL,
    "usuario" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AcaoDesenvolvimentoComentario_acaoId_fkey" FOREIGN KEY ("acaoId") REFERENCES "AcaoDesenvolvimento" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AcaoDesenvolvimentoHistorico" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "acaoId" INTEGER NOT NULL,
    "usuario" TEXT NOT NULL,
    "alteracoes" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AcaoDesenvolvimentoHistorico_acaoId_fkey" FOREIGN KEY ("acaoId") REFERENCES "AcaoDesenvolvimento" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificacaoInterna" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "destinatarioId" INTEGER NOT NULL,
    "acaoId" INTEGER,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "lidaEm" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificacaoInterna_destinatarioId_fkey" FOREIGN KEY ("destinatarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NotificacaoInterna_acaoId_fkey" FOREIGN KEY ("acaoId") REFERENCES "AcaoDesenvolvimento" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AcaoDesenvolvimento_responsavelId_status_prazo_idx" ON "AcaoDesenvolvimento"("responsavelId", "status", "prazo");
CREATE INDEX "AcaoDesenvolvimento_planoTreinoId_idx" ON "AcaoDesenvolvimento"("planoTreinoId");
CREATE INDEX "AcaoDesenvolvimentoComentario_acaoId_id_idx" ON "AcaoDesenvolvimentoComentario"("acaoId", "id");
CREATE INDEX "AcaoDesenvolvimentoHistorico_acaoId_id_idx" ON "AcaoDesenvolvimentoHistorico"("acaoId", "id");
CREATE INDEX "NotificacaoInterna_destinatarioId_lidaEm_id_idx" ON "NotificacaoInterna"("destinatarioId", "lidaEm", "id");
CREATE INDEX "NotificacaoInterna_acaoId_idx" ON "NotificacaoInterna"("acaoId");
