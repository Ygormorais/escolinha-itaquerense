-- O check-in pelo link gravava a presença às 12:00 UTC; a chamada da turma usa 00:00 UTC.
-- Move os registros de 12:00 para a meia-noite do mesmo dia.

-- 1. Já existe registro do dia à meia-noite: o check-in prova a presença, então uma
--    "Ausente" lançada sem ver o check-in vira "Presente". Justificativas ficam como estão.
UPDATE "Frequencia" SET "presenca" = 'Presente'
WHERE substr("data", 11, 13) = 'T00:00:00.000'
  AND "presenca" = 'Ausente'
  AND EXISTS (
    SELECT 1 FROM "Frequencia" AS c
    WHERE c."alunoId" = "Frequencia"."alunoId"
      AND substr(c."data", 1, 10) = substr("Frequencia"."data", 1, 10)
      AND substr(c."data", 11, 13) = 'T12:00:00.000'
      AND c."presenca" = 'Presente'
  );

-- 2. Remove o registro de 12:00 que tem par à meia-noite (seria duplicado).
DELETE FROM "Frequencia"
WHERE substr("data", 11, 13) = 'T12:00:00.000'
  AND EXISTS (
    SELECT 1 FROM "Frequencia" AS m
    WHERE m."alunoId" = "Frequencia"."alunoId"
      AND substr(m."data", 1, 10) = substr("Frequencia"."data", 1, 10)
      AND substr(m."data", 11, 13) = 'T00:00:00.000'
  );

-- 3. Os demais passam para a meia-noite UTC, no formato gravado pelo Prisma.
UPDATE "Frequencia" SET "data" = substr("data", 1, 10) || 'T00:00:00.000+00:00'
WHERE substr("data", 11, 13) = 'T12:00:00.000';
