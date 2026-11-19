-- Notícias ganham página própria: slug estável, texto da matéria e vídeo do YouTube.
ALTER TABLE "Noticia" ADD COLUMN "slug" TEXT;
ALTER TABLE "Noticia" ADD COLUMN "corpo" TEXT;
ALTER TABLE "Noticia" ADD COLUMN "videoUrl" TEXT;

-- Notícias já existentes recebem um slug estável baseado no id (único por definição).
UPDATE "Noticia" SET "slug" = 'noticia-' || "id" WHERE "slug" IS NULL;

CREATE UNIQUE INDEX "Noticia_slug_key" ON "Noticia"("slug");
