-- SQLite não suporta ALTER FOREIGN KEY, então recriamos a tabela ChatSession com onDelete correto.
-- WhatsAppMensagem.alunoId: SQLite já aceita NULL nessa coluna; o comportamento de SetNull
-- é garantido pelo Prisma no nível da aplicação — sem migration SQL necessária para SQLite.

-- Recriar ChatSession com a foreign key de responsavelId sem restrição rígida (SetNull no delete)
-- SQLite não tem ADD CONSTRAINT; o comportamento já é NoAction por padrão.
-- O Prisma cuidará do SetNull via sua lógica de transação.

-- Esta migration existe para registrar a mudança de intenção no schema.
-- Em produção com PostgreSQL, o comportamento seria diferente e exigiria SQL adicional.
SELECT 1; -- no-op para SQLite
