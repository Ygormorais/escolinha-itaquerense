import Link from "next/link"

export const metadata = { title: "Termos de Uso — Escolinha Itaquerense" }

export default function TermosPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12 text-foreground">
      <Link href="/" className="text-sm font-medium text-brand-700 hover:underline">Voltar ao site</Link>
      <h1 className="mt-8 font-heading text-4xl font-bold">Termos de Uso</h1>
      <p className="mt-3 text-muted-foreground">Última atualização: 16 de julho de 2026.</p>
      <div className="mt-10 space-y-7 leading-7 text-muted-foreground">
        <section><h2 className="text-xl font-semibold text-foreground">Uso do portal</h2><p>O portal é destinado à gestão das atividades da Escolinha Itaquerense e ao acompanhamento dos alunos pelos responsáveis cadastrados. Cada usuário deve manter suas credenciais em sigilo.</p></section>
        <section><h2 className="text-xl font-semibold text-foreground">Informações e pagamentos</h2><p>Informações de frequência, avaliações, agenda e pagamentos devem ser conferidas pelos responsáveis. Pagamentos por PIX ou boleto dependem da confirmação do provedor financeiro e da baixa no sistema.</p></section>
        <section><h2 className="text-xl font-semibold text-foreground">Condutas</h2><p>É proibido tentar acessar dados de outros alunos, interferir no funcionamento do sistema ou usar o portal para finalidades não relacionadas à escolinha.</p></section>
        <section><h2 className="text-xl font-semibold text-foreground">Revisão</h2><p>Os termos podem ser atualizados para refletir mudanças operacionais ou legais. Este texto deve receber validação jurídica antes da publicação comercial definitiva.</p></section>
      </div>
    </main>
  )
}
