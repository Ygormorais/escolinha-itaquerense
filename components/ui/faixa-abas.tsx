"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

/**
 * Faixa de abas com rolagem horizontal no celular: rola até a aba ativa
 * (aria-current="page") e esmaece a borda direita para indicar que há mais abas.
 */
export function FaixaAbas({ className, children, ...props }: React.ComponentProps<"div">) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    const ativa = el?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!el || !ativa) return
    const fora = ativa.offsetLeft < el.scrollLeft || ativa.offsetLeft + ativa.offsetWidth > el.scrollLeft + el.clientWidth
    if (fora) el.scrollTo({ left: ativa.offsetLeft - 16 })
  })

  return (
    <div
      ref={ref}
      className={cn(
        "flex min-w-0 max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "[mask-image:linear-gradient(to_right,#000_calc(100%-24px),transparent)] md:[mask-image:none]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
