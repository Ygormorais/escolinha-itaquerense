import { PortalShell } from "@/components/responsavel/portal-shell"

export default function ResponsavelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="portal-familia min-h-screen">
      <PortalShell>{children}</PortalShell>
    </div>
  )
}
