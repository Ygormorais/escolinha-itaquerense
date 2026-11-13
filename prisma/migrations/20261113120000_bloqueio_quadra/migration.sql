-- CreateTable
CREATE TABLE "BloqueioQuadra" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dataInicio" DATETIME NOT NULL,
    "dataFim" DATETIME NOT NULL,
    "motivo" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "BloqueioQuadra_dataInicio_dataFim_idx" ON "BloqueioQuadra"("dataInicio", "dataFim");
