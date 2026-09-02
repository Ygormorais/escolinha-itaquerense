import { canAccessStaffPath, isStaffRole, type StaffRole } from "@/lib/permissions"

const DEFAULT_DESTINATIONS: Record<StaffRole, string> = {
  admin: "/dashboard",
  secretaria: "/secretaria",
  tecnico: "/desenvolvimento",
}

export function isSafeInternalPath(path: string | null | undefined): path is string {
  return Boolean(path && path.startsWith("/") && !path.startsWith("//"))
}

export function staffDefaultDestination(role: string | undefined): string {
  return isStaffRole(role) ? DEFAULT_DESTINATIONS[role] : "/dashboard"
}

export function resolveStaffDestination(nextPath: string | null | undefined, role: string | undefined): string {
  const fallback = staffDefaultDestination(role)
  if (!isStaffRole(role) || !isSafeInternalPath(nextPath)) return fallback

  const pathname = nextPath.split(/[?#]/, 1)[0]
  if (pathname === "/" || pathname === "/login" || pathname.startsWith("/responsavel") || pathname.startsWith("/api")) {
    return fallback
  }
  return canAccessStaffPath(pathname, role) ? nextPath : fallback
}
