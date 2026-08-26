"use client"

import { useState, type ComponentProps } from "react"
import { Eye, EyeOff, Lock } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type PasswordFieldProps = Omit<ComponentProps<typeof Input>, "type">

export function PasswordField({ className, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Lock aria-hidden="true" className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-ink-500)]" />
      <Input
        type={visible ? "text" : "password"}
        className={cn("pl-11 pr-12", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-[var(--color-ink-500)] transition-colors hover:bg-brand-50 hover:text-[var(--color-ink-900)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}
