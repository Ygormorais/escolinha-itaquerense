-- CreateTable
CREATE TABLE "LancamentoBancario" (
    "id"        INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "data"      DATETIME NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor"     REAL NOT NULL,
    "tipo"      TEXT NOT NULL,
    "saldo"     REAL,
    "banco"     TEXT,
    "arquivo"   TEXT NOT NULL,
    "status"    TEXT NOT NULL DEFAULT 'novo',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "LancamentoBancario_data_idx" ON "LancamentoBancario"("data");

-- CreateIndex
CREATE INDEX "LancamentoBancario_tipo_idx" ON "LancamentoBancario"("tipo");

-- CreateIndex
CREATE INDEX "LancamentoBancario_status_idx" ON "LancamentoBancario"("status");
