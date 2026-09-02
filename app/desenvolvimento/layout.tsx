import type { ReactNode } from "react"
import { DesenvolvimentoNav } from "./nav-desenvolvimento"

export default function DesenvolvimentoLayout({ children }: { children: ReactNode }) {
  return <><DesenvolvimentoNav />{children}</>
}
