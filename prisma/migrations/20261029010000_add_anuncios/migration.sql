-- Banners de publicidade do site público (patrocinadores e loja do clube).
-- CreateTable
CREATE TABLE "Anuncio" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "anunciante" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "imagemUrl" TEXT NOT NULL,
    "imagemMobileUrl" TEXT,
    "link" TEXT NOT NULL,
    "posicao" TEXT NOT NULL DEFAULT 'landing',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "inicio" DATETIME,
    "fim" DATETIME,
    "cliques" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Anuncio_posicao_ativo_idx" ON "Anuncio"("posicao", "ativo");

