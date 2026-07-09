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
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <NavResponsavel />
      <div className="min-w-0 font-body text-[var(--text)]">{children}</div>
    </div>
  )
}
