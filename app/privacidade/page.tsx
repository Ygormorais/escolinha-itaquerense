import Link from "next/link"

export const metadata = { title: "Política de Privacidade — Escolinha Itaquerense" }

export default function PrivacidadePage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12 text-foreground">
      <Link href="/" className="text-sm font-medium text-brand-700 hover:underline">Voltar ao site</Link>
      <h1 className="mt-8 font-heading text-4xl font-bold">Política de Privacidade</h1>
      <p className="mt-3 text-muted-foreground">Última atualização: 11 de agosto de 2026.</p>
      <div className="mt-10 space-y-7 leading-7 text-muted-foreground">
        <section><h2 className="text-xl font-semibold text-foreground">Dados tratados</h2><p>Tratamos dados de alunos, responsáveis e equipe necessários para matrícula, atividades esportivas, comunicação, pagamentos e segurança. Dados de saúde só devem ser informados quando necessários ao atendimento do aluno.</p></section>
        <section><h2 className="text-xl font-semibold text-foreground">Finalidades e acesso</h2><p>Os dados são usados para administrar a escolinha e o portal da família. O acesso é limitado por perfil: responsáveis visualizam somente alunos vinculados; equipe administrativa acessa informações necessárias à sua função.</p></section>
        <section><h2 className="text-xl font-semibold text-foreground">Segurança e retenção</h2><p>Usamos autenticação, controle de acesso, cópias de segurança com acesso restrito, criptografia nas cópias externas e registros de auditoria. Pedidos de pré-matrícula pendentes são removidos após 90 dias; pedidos recusados, após 30 dias da decisão; e os documentos dos pedidos aprovados, após 90 dias. Arquivos enviados sem conclusão do pedido são removidos após 24 horas. Outros dados são mantidos pelo período necessário às finalidades administrativas, esportivas e legais aplicáveis.</p></section>
        <section><h2 className="text-xl font-semibold text-foreground">Solicitações</h2><p>O responsável pode solicitar atualização, correção ou esclarecimentos pelos canais oficiais da Escolinha Itaquerense. Esta política deve ser revisada pelo responsável legal da organização antes da publicação comercial.</p></section>
      </div>
    </main>
  )
}
