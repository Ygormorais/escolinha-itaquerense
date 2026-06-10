CREATE TABLE "PushSubscription" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "responsavelId" INTEGER NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PushSubscription_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Responsavel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
CREATE INDEX "PushSubscription_responsavelId_idx" ON "PushSubscription"("responsavelId");
CREATE TABLE "NotificacaoPreferencia" (
    "responsavelId" INTEGER NOT NULL PRIMARY KEY,
    "vencimento" BOOLEAN NOT NULL DEFAULT 1,
    "pagamentoConfirmado" BOOLEAN NOT NULL DEFAULT 1,
    "falta" BOOLEAN NOT NULL DEFAULT 0,
    "convocacao" BOOLEAN NOT NULL DEFAULT 1,
    "comunicado" BOOLEAN NOT NULL DEFAULT 1,
    CONSTRAINT "NotificacaoPreferencia_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Responsavel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
