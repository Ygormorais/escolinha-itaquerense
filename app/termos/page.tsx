import { PaginaPublica } from "@/components/site/pagina-publica"

export const metadata = { title: "Termos de Uso — Escolinha Itaquerense" }

export default function TermosPage() {
  return (
    <PaginaPublica titulo="Termos de Uso" descricao="Regras de uso do site, do painel da equipe e do portal da família." largura="leitura">
      <p className="pg-atualizacao">Última atualização: 16 de julho de 2026.</p>
      <div className="pg-texto">
        <h2>Uso do portal</h2>
        <p>O portal é destinado à gestão das atividades da Escolinha Itaquerense e ao acompanhamento dos alunos pelos responsáveis cadastrados. Cada usuário deve manter suas credenciais em sigilo.</p>
        <h2>Informações e pagamentos</h2>
        <p>Informações de frequência, avaliações, agenda e pagamentos devem ser conferidas pelos responsáveis. Pagamentos por PIX ou boleto dependem da confirmação do provedor financeiro e da baixa no sistema.</p>
        <h2>Condutas</h2>
        <p>É proibido tentar acessar dados de outros alunos, interferir no funcionamento do sistema ou usar o portal para finalidades não relacionadas à escolinha.</p>
        <h2>Revisão</h2>
        <p>Os termos podem ser atualizados para refletir mudanças operacionais ou legais. Este texto deve receber validação jurídica antes da publicação comercial definitiva.</p>
      </div>
    </PaginaPublica>
  )
}
