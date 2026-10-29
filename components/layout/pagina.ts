/**
 * Contêiner padrão das telas do painel: largura máxima, respiro lateral fluido,
 * coluna com 24px entre blocos e fundo papel no tema claro. Use na raiz de cada tela
 * (e no loading.tsx correspondente) para todas terem a mesma margem e largura.
 */
export const PAGINA_ADMIN =
  "mx-auto flex w-full max-w-[var(--content-max)] min-w-0 flex-col gap-6 bg-[var(--color-paper-50)]/40 p-[var(--space-page)] dark:bg-transparent"

/**
 * Coluna padrão das telas do portal do responsável. A largura e a margem já vêm do
 * PortalShell; aqui só fica o espaçamento entre blocos, igual em todas as telas.
 */
export const PAGINA_PORTAL = "flex min-w-0 flex-col gap-8"
