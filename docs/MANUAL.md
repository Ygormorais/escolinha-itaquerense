# Manual de Uso — Sistema da Escolinha Itaquerense

Guia prático para a secretaria e administração do clube. Cada seção descreve o
fluxo do dia a dia; os caminhos referem-se ao menu lateral do painel (ou à barra
inferior, no celular).

> **Acesso ao painel:** `https://<seu-dominio>/login` com o usuário e senha de
> administrador. Existem três papéis: **admin** (tudo), **secretaria** (operação)
> e **técnico** (esportivo). No primeiro acesso um tour de 8 passos apresenta o
> sistema — dá para pular e reabrir depois pelo ícone de ajuda no rodapé do menu.

---

## 1. Rotina diária

A página **Secretaria** é o ponto de partida do dia: alunos ativos, matrículas do
mês, inadimplentes, aniversariantes e os eventos de hoje, com atalhos para cada um.
O **Dashboard** complementa com a visão financeira do mês (receita, custos, saldo,
presença média) e alertas de mensalidades vencendo.

## 2. Alunos

**Alunos → Novo Aluno** cadastra nome, nascimento, turma, horário, responsável,
contato, mensalidade e desconto. A turma define a categoria (Sub-7, Sub-9...).

- **Importar/Exportar CSV**: para migração em massa ou planilhas.
- A página de cada aluno concentra tudo: mensalidades, frequência, uniformes,
  avaliações, gráfico de adimplência e a ficha de matrícula para impressão.
- **Inativar** um aluno o tira das cobranças e listas sem apagar o histórico.
- **Busca global** (`Ctrl+K` em qualquer tela) encontra alunos, responsáveis e
  campeonatos.

## 3. Matrículas online

O site público tem o formulário de **pré-matrícula** (`/matricula`). As recebidas
aparecem em **Configurações → Matrículas**, onde a secretaria revisa e **aprova**
— a aprovação já cria o aluno com mensalidades. Os documentos enviados ficam
restritos a usuários logados.

## 4. Mensalidades e pagamentos

Em **Pagamentos**:

1. **Gerar Mensalidades** cria as cobranças do mês para todos os alunos ativos
   (o dia de vencimento vem de Configurações). Pode gerar de novo sem medo:
   mensalidades existentes não são duplicadas.
2. Registre um pagamento pelo botão da linha (data, forma, valor) ou selecione
   várias linhas e registre **em lote**.
3. **Recibos** emite comprovante numerado para impressão/PDF.

A **Inadimplência** lista quem tem mensalidade vencida (apenas alunos ativos),
com telefone, meses em aberto e nível de atraso. Dá para **notificar por
WhatsApp** (um a um ou em lote) e por e-mail.

## 5. Caixa

Visão financeira do mês com detalhamento por forma de pagamento:

- **PIX / Boleto / Dinheiro**: extrato de cada forma. Em Dinheiro também se
  registram entradas avulsas (ex.: venda no balcão).
- **Maquininha**: importe o CSV da operadora e **reconcilie** cada transação com
  o aluno correspondente.
- **Descontos**: alunos com desconto na mensalidade e o impacto total.
- **Recebimentos**: tudo do mês em uma lista, com exportação CSV.

O **Relatório** (menu lateral) consolida o ano: receita × custos por mês, custos
por categoria, com exportação CSV e impressão em PDF.

## 6. Custos

**Custos** registra despesas (data, categoria, descrição, fornecedor, valor,
forma). A aba **Recorrentes** guarda modelos (aluguel, água...) e o botão
**Gerar Recorrentes** lança todos no mês atual de uma vez.

## 7. Frequência

**Frequência → Registro**: escolha turma e data, carregue a lista e marque
presente/ausente/justificado. O **Scanner QR** permite check-in pela carteirinha
do aluno. Em **QR Code de Presença**, a equipe projeta um link seguro da turma,
válido por 12 horas; cada aluno informa matrícula e data de nascimento, sem que
a lista da turma fique pública. As abas **Resumo Mensal** e **Estatísticas**
mostram percentuais e o ranking de presença — alunos abaixo de 75% ganham destaque.

## 8. Agenda e comunicados

**Agenda** é o calendário do clube (treinos, jogos, eventos e reuniões) — clique
num dia para criar. **Comunicados** envia aviso em massa via WhatsApp para uma
turma ou para todas.

## 9. Campeonatos e jogos

**Campeonatos** controla competições, taxas e inscrições de alunos.

- Campeonatos federados podem ser **sincronizados com a FPFS** (resultados,
  classificação e súmulas entram sozinhos; um robô atualiza diariamente).
- Em cada partida, o quadro de **Escalação** monta o time por posição (arrastar
  e soltar) e o painel de **Convocação** notifica os responsáveis por push — eles
  confirmam ou declinam a presença pelo portal, e o painel mostra quem respondeu.
  Quem permanece na escalação mantém a resposta se você salvar de novo.
- Os jogos sincronizados aparecem automaticamente no site público e no portal.

## 10. Uniformes

**Uniformes** controla a entrega por aluno: adicione itens (camisa, calção...),
com tamanho, e marque a entrega quando acontecer.

## 11. Virada de categoria

Uma vez por ano, em **Configurações → Categorias**, o sistema propõe a promoção
de cada aluno pela idade que completa no ano (Sub-9 → Sub-11 etc.). Revise a
lista, desmarque exceções e aplique tudo de uma vez.

## 12. Portal do responsável

Os responsáveis acessam `https://<seu-dominio>/responsavel` com e-mail e senha
(contas em **Configurações → Responsáveis**, vinculadas aos alunos). No portal:

- mensalidades (com PIX/boleto quando o Mercado Pago está configurado);
- frequência, desempenho, boletim e carteirinha digital de cada filho;
- jogos e convocações (confirmar presença), classificação e galeria;
- solicitações para a secretaria (respondidas em **Configurações → Solicitações**);
- **declaração anual** de pagamentos para imposto de renda;
- notificações push do clube (ative ao entrar no portal).

Também há o **chatbot de WhatsApp**: responsáveis pedem segunda via de cobrança,
consultam frequência e recebem o PIX direto na conversa.

## 13. Configurações

- **Geral**: nome do clube, endereço, WhatsApp oficial, dia de vencimento,
  valores padrão e meta mensal.
- **Responsáveis**: contas do portal e vínculo com alunos.
- **Matrículas / Solicitações**: filas vindas do site e do portal.
- **Escalações**: sessões do chatbot de escalação bloqueadas/liberadas.
- **Mídia**: fotos e vídeos dos campeonatos (alimenta a galeria do portal).
- **Categorias**: virada anual (item 11).

## 14. Auditoria e segurança

- **Histórico** registra quem fez o quê (pagamentos, edições, convocações...).
- Fotos de alunos e documentos de matrícula só são servidos a usuários
  autorizados; o responsável vê apenas os próprios filhos.
- O login tem limite de tentativas por minuto em produção.

## 15. Boas práticas

- Gere as mensalidades no primeiro dia útil do mês e confira a Inadimplência
  toda semana.
- Importe o CSV da maquininha semanalmente para não acumular reconciliação.
- O backup diário roda na VPS (ver `deploy/README.md`); confira de tempos em
  tempos se os arquivos estão sendo copiados para fora do servidor.
