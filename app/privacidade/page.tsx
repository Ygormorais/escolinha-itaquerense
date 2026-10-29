import { PaginaPublica } from "@/components/site/pagina-publica"

export const metadata = { title: "Política de Privacidade — Escolinha Itaquerense" }

export default function PrivacidadePage() {
  return (
    <PaginaPublica titulo="Política de Privacidade" descricao="Quais dados tratamos, para quê, quem acessa e por quanto tempo guardamos." largura="leitura">
      <p className="pg-atualizacao">Última atualização: 11 de agosto de 2026.</p>
      <div className="pg-texto">
        <h2>Dados tratados</h2>
        <p>Tratamos dados de alunos, responsáveis e equipe necessários para matrícula, atividades esportivas, comunicação, pagamentos e segurança. Dados de saúde só devem ser informados quando necessários ao atendimento do aluno.</p>
        <h2>Finalidades e acesso</h2>
        <p>Os dados são usados para administrar a escolinha e o portal da família. O acesso é limitado por perfil: responsáveis visualizam somente alunos vinculados; equipe administrativa acessa informações necessárias à sua função.</p>
        <h2>Segurança e retenção</h2>
        <p>Usamos autenticação, controle de acesso, cópias de segurança com acesso restrito, criptografia nas cópias externas e registros de auditoria. Pedidos de pré-matrícula pendentes são removidos após 90 dias; pedidos recusados, após 30 dias da decisão; e os documentos dos pedidos aprovados, após 90 dias. Arquivos enviados sem conclusão do pedido são removidos após 24 horas. Outros dados são mantidos pelo período necessário às finalidades administrativas, esportivas e legais aplicáveis.</p>
        <h2>Solicitações</h2>
        <p>O responsável pode solicitar atualização, correção ou esclarecimentos pelos canais oficiais da Escolinha Itaquerense. Esta política deve ser revisada pelo responsável legal da organização antes da publicação comercial.</p>
      </div>
    </PaginaPublica>
  )
}
