"use client"

/**
 * Único link "pular para o conteúdo" do sistema (admin, site público, portal).
 * Leva o foco ao <main> da página atual; sem JavaScript, cai no âncora
 * #main-content (wrapper do shell). Visível só quando recebe foco.
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      onClick={(event) => {
        const alvo = document.querySelector<HTMLElement>("main")
        if (!alvo) return
        event.preventDefault()
        if (!alvo.hasAttribute("tabindex")) alvo.setAttribute("tabindex", "-1")
        alvo.focus()
        alvo.scrollIntoView({ block: "start" })
      }}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-lg focus:bg-brand-800 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none"
    >
      Pular para o conteúdo
    </a>
  )
}
