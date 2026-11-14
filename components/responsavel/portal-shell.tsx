"use client"

import { usePathname } from "next/navigation"
import { NavResponsavel } from "@/components/responsavel/nav-responsavel"

/**
 * Shell leve do portal: só o client necessário (pathname + nav).
 * Mantém o layout pai como Server Component para streaming/RSC.
 */
export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage =
    pathname.startsWith("/responsavel/login") ||
    pathname.startsWith("/responsavel/recuperar-senha") ||
    pathname.startsWith("/responsavel/redefinir-senha")

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-4 pb-24 sm:px-6 sm:pt-6 md:pb-8 lg:px-8 lg:pt-8">
      <NavResponsavel />
      <div className="min-w-0 font-body text-[var(--text)]">{children}</div>
    </div>
  )
}
