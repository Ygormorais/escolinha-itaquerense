-- Acelera os filtros mensais e de inadimplência usados no dashboard administrativo.
CREATE INDEX "Pagamento_mesReferencia_dataPagamento_idx" ON "Pagamento"("mesReferencia", "dataPagamento");
CREATE INDEX "Pagamento_dataPagamento_dataVencimento_idx" ON "Pagamento"("dataPagamento", "dataVencimento");
