# Política de privacidade — rascunho para revisão jurídica

> **Rascunho técnico, sem valor jurídico.** Descreve o que o sistema faz hoje, para o advogado ou
> o responsável pela escolinha revisar, completar e aprovar. Os campos `[ ]` precisam ser
> preenchidos. A página pública atual (`app/privacidade/page.tsx`) é mais curta e só deve ser
> trocada por este texto depois da revisão.

## 1. Quem é o controlador

- Razão social: `[ ]`
- CNPJ: `[ ]`
- Endereço: `[ ]`
- Contato para assuntos de privacidade (e-mail e WhatsApp): `[ ]`
- Encarregado pelo tratamento de dados (LGPD, art. 41), se houver: `[ ]`

## 2. Quais dados tratamos e para quê

| Situação | Dados | Finalidade | Base legal sugerida (a confirmar) |
| --- | --- | --- | --- |
| Pré-matrícula e matrícula | nome, data de nascimento, documentos do aluno; nome, telefone, e-mail e CPF do responsável | cadastrar o aluno, formar turmas, contato | execução de contrato / procedimentos preliminares |
| Ficha médica | alergias, condições de saúde, contato de emergência | segurança do atleta durante as atividades | proteção da vida e da incolumidade física; consentimento específico do responsável |
| Frequência, desempenho, boletim, objetivos | presença, avaliações técnicas | acompanhar o desenvolvimento do atleta e informar a família | execução de contrato |
| Mensalidades e recibos | valores, vencimentos, forma de pagamento, recibos | cobrança e prestação de contas | execução de contrato; obrigação legal |
| Aula experimental | nome da criança, idade, nome e telefone do responsável | agendar e confirmar a aula | procedimentos preliminares |
| Pesquisa de satisfação | nota, comentário opcional, turmas dos atletas; o nome só aparece se a família não pedir anonimato | melhorar o serviço | legítimo interesse |
| Imagens e vídeos (mural, redes, matérias) | fotos e vídeos de treinos e jogos | divulgação e memória do clube | consentimento específico do responsável (`[ ]` confirmar o termo usado) |
| Portal e área da equipe | e-mail, senha (guardada de forma irreversível), registros de acesso | autenticar e proteger as contas | legítimo interesse; segurança |
| Notificações no aparelho (opcional) | identificador técnico do navegador | avisos do portal | consentimento |

Dados de crianças e adolescentes são tratados no melhor interesse deles e com consentimento
de pelo menos um dos pais ou responsável legal (LGPD, art. 14).

## 3. Com quem compartilhamos

Só o necessário e por meio de prestadores que operam em nosso nome. Confirmar a lista final antes de publicar:

- Hospedagem do sistema e das cópias de segurança: `[provedor da VPS e do armazenamento de backup]`
- Envio de e-mail (recuperação de senha e avisos): `[provedor SMTP]`
- WhatsApp: as mensagens são abertas pela secretaria no próprio aplicativo (link de conversa); `[se for usada a integração automática, citar o provedor]`
- Federação Paulista de Futsal: dados esportivos do atleta inscritos em competições `[ ]`
- Google (mapa e agenda), se ativados: `[ ]`
- Autoridades, quando exigido por lei.

Não vendemos dados pessoais.

## 4. Cookies e armazenamento no aparelho

- Cookie de sessão, necessário para entrar no portal ou na área da equipe.
- Preferência de tema (claro/escuro) guardada no aparelho.
- `[ ]` Se for instalada ferramenta de estatísticas de visitas, descrever aqui e avaliar aviso de cookies.

## 5. Por quanto tempo guardamos

- Pedidos de pré-matrícula pendentes: removidos após 90 dias. Recusados: 30 dias após a decisão. Documentos de pedidos aprovados: 90 dias.
- Arquivos enviados sem conclusão do pedido: 24 horas.
- Dados de alunos e responsáveis ativos: enquanto durar o vínculo.
- Dados financeiros: pelo prazo exigido pela legislação fiscal e contábil `[ ]`.
- Demais dados: pelo tempo necessário às finalidades acima. `[ ]` Definir prazo após a saída do aluno.

## 6. Segurança

Controle de acesso por perfil, senhas guardadas de forma irreversível, limite de tentativas de entrada, conexão
criptografada (HTTPS), cópias de segurança com acesso restrito e criptografia nas cópias externas, e registro de
operações sensíveis. Nenhum sistema é totalmente imune; em caso de incidente com risco relevante, avisaremos
os titulares e a ANPD conforme a lei `[ ]` (definir quem comunica e em quanto tempo).

## 7. Direitos do titular

O responsável pode, a qualquer momento e pelo contato do item 1: confirmar que tratamos os dados, acessá-los,
corrigi-los, pedir anonimização, bloqueio ou eliminação de dados desnecessários, pedir portabilidade, saber com quem
compartilhamos, revogar consentimentos (por exemplo, o uso de imagem) e pedir revisão de decisões automatizadas.
Respondemos em até `[ ]` dias.

## 8. Alterações

Quando esta política mudar, a data de atualização no topo da página muda também. Mudanças relevantes são
avisadas no portal.

## Pontos que o revisor precisa decidir

1. Dados do controlador (item 1) e se há encarregado.
2. Texto do termo de uso de imagem e se o consentimento é colhido na matrícula.
3. Prazos de retenção financeira e pós-saída do aluno.
4. Lista final de prestadores (item 3).
5. Necessidade de aviso de cookies, conforme as ferramentas de estatística que forem instaladas.
