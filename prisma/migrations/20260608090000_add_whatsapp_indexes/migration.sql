-- Indexes para WhatsAppMensagem
-- messageId: deduplicação no webhook (findFirst por messageId em cada mensagem recebida)
CREATE INDEX IF NOT EXISTS "WhatsAppMensagem_messageId_idx" ON "WhatsAppMensagem"("messageId");

-- alunoId: histórico por aluno no painel
CREATE INDEX IF NOT EXISTS "WhatsAppMensagem_alunoId_idx" ON "WhatsAppMensagem"("alunoId");

-- createdAt: housekeeping (deleteMany onde createdAt < limite)
CREATE INDEX IF NOT EXISTS "WhatsAppMensagem_createdAt_idx" ON "WhatsAppMensagem"("createdAt");

-- origem + direcao: filtro de comunicados na página de comunicados
CREATE INDEX IF NOT EXISTS "WhatsAppMensagem_origem_direcao_idx" ON "WhatsAppMensagem"("origem", "direcao");
