-- O modelo Noticia entrou no schema sem migration. IF NOT EXISTS mantém o
-- deploy seguro em bancos que tenham recebido prisma db push manualmente.
CREATE TABLE IF NOT EXISTS "Noticia" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "subtitulo" TEXT,
    "categoria" TEXT NOT NULL DEFAULT 'Notícia',
    "imagemUrl" TEXT,
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "destaque" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE INDEX IF NOT EXISTS "Noticia_publicado_idx" ON "Noticia"("publicado");
CREATE INDEX IF NOT EXISTS "Noticia_createdAt_idx" ON "Noticia"("createdAt");
CREATE INDEX IF NOT EXISTS "Avaliacao_alunoId_idx" ON "Avaliacao"("alunoId");
CREATE INDEX IF NOT EXISTS "Evento_data_idx" ON "Evento"("data");
CREATE INDEX IF NOT EXISTS "Evento_status_idx" ON "Evento"("status");
CREATE INDEX IF NOT EXISTS "Partida_campeonatoId_idx" ON "Partida"("campeonatoId");
CREATE INDEX IF NOT EXISTS "Partida_data_idx" ON "Partida"("data");
CREATE INDEX IF NOT EXISTS "PreMatricula_status_idx" ON "PreMatricula"("status");
CREATE INDEX IF NOT EXISTS "PreMatricula_createdAt_idx" ON "PreMatricula"("createdAt");
CREATE INDEX IF NOT EXISTS "Produto_ativo_idx" ON "Produto"("ativo");
CREATE INDEX IF NOT EXISTS "Produto_createdAt_idx" ON "Produto"("createdAt");
CREATE INDEX IF NOT EXISTS "ResetToken_responsavelId_idx" ON "ResetToken"("responsavelId");
CREATE INDEX IF NOT EXISTS "ResetToken_expiresAt_idx" ON "ResetToken"("expiresAt");
CREATE INDEX IF NOT EXISTS "Solicitacao_status_idx" ON "Solicitacao"("status");
CREATE INDEX IF NOT EXISTS "Solicitacao_createdAt_idx" ON "Solicitacao"("createdAt");
