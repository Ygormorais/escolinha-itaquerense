-- CreateTable
CREATE TABLE "DocumentoInstitucional" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoPor" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DocumentoVersao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "documentoId" INTEGER NOT NULL,
    "versao" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "url" TEXT,
    "turmas" TEXT NOT NULL DEFAULT 'Todas',
    "obrigatorio" BOOLEAN NOT NULL DEFAULT true,
    "publicadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoPor" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DocumentoVersao_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "DocumentoInstitucional" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DocumentoAceite" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "versaoId" INTEGER NOT NULL,
    "responsavelId" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "declaracao" TEXT NOT NULL,
    "aceitoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DocumentoAceite_versaoId_fkey" FOREIGN KEY ("versaoId") REFERENCES "DocumentoVersao" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DocumentoAceite_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Responsavel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DocumentoAceite_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DocumentoInstitucional_ativo_categoria_idx" ON "DocumentoInstitucional"("ativo", "categoria");
CREATE UNIQUE INDEX "DocumentoVersao_documentoId_versao_key" ON "DocumentoVersao"("documentoId", "versao");
CREATE INDEX "DocumentoVersao_documentoId_publicadoEm_idx" ON "DocumentoVersao"("documentoId", "publicadoEm");
CREATE UNIQUE INDEX "DocumentoAceite_versaoId_responsavelId_alunoId_key" ON "DocumentoAceite"("versaoId", "responsavelId", "alunoId");
CREATE INDEX "DocumentoAceite_responsavelId_aceitoEm_idx" ON "DocumentoAceite"("responsavelId", "aceitoEm");
CREATE INDEX "DocumentoAceite_alunoId_idx" ON "DocumentoAceite"("alunoId");
