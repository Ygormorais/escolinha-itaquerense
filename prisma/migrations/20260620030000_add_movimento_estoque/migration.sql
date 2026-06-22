CREATE TABLE "MovimentoEstoque" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "produtoId" INTEGER NOT NULL,
  "tipo" TEXT NOT NULL,
  "quantidade" INTEGER NOT NULL,
  "motivo" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MovimentoEstoque_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "MovimentoEstoque_produtoId_idx" ON "MovimentoEstoque"("produtoId");
