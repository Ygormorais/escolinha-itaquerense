-- Versão de sessão: revoga cookies emitidos antes de troca de senha ou logout.
ALTER TABLE "Usuario" ADD COLUMN "sessaoVersao" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Responsavel" ADD COLUMN "sessaoVersao" INTEGER NOT NULL DEFAULT 0;
