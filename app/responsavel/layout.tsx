"use client"

import { usePathname } from "next/navigation"
import { NavResponsavel } from "@/components/responsavel/nav-responsavel"

export default function ResponsavelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname.startsWith("/responsavel/login") ||
    pathname.startsWith("/responsavel/recuperar-senha") ||
    pathname.startsWith("/responsavel/redefinir-senha")

  if (isAuthPage) return <>{children}</>

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        <NavResponsavel />
        {children}
      </div>
    </div>
  )
}
