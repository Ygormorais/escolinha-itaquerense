-- CreateTable
CREATE TABLE "WhatsAppMensagem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "alunoId" INTEGER,
    "telefone" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'text',
    "direcao" TEXT NOT NULL DEFAULT 'outgoing',
    "status" TEXT NOT NULL DEFAULT 'sent',
    "instancia" TEXT NOT NULL DEFAULT 'escolinha',
    "origem" TEXT NOT NULL DEFAULT 'manual',
    "intent" TEXT,
    "confidence" REAL,
    "messageId" TEXT,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WhatsAppMensagem_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
