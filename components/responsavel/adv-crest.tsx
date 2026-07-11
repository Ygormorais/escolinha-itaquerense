"use client"

import { viaProxyEscudo } from "@/lib/landing/escudo-adversario"
import { cn } from "@/lib/utils"

/**
 * Escudo do adversário com fallback monograma.
 * Usa a 1ª URL candidata; 404 some para monograma via onError.
 */
export function AdvCrest({
  urls,
  name,
  size = 40,
  className,
}: {
  urls: string[]
  name: string
  size?: number
  className?: string
}) {
  const src = urls[0] ?? null
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "ADV"

  if (!src) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground",
          className,
        )}
        style={{ width: size, height: size }}
        aria-hidden
      >
        {initials}
      </span>
    )
  }

  return (
    <span
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full border border-border bg-white",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={viaProxyEscudo(src)}
        alt=""
        width={size}
        height={size}
        className="size-full object-contain p-0.5"
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={(e) => {
          const el = e.currentTarget
          el.style.display = "none"
          const parent = el.parentElement
          if (parent && !parent.querySelector("[data-crest-fallback]")) {
            const span = document.createElement("span")
            span.dataset.crestFallback = "1"
            span.className =
              "flex size-full items-center justify-center bg-muted text-[10px] font-bold text-muted-foreground"
            span.textContent = initials
            parent.appendChild(span)
          }
        }}
      />
    </span>
  )
}
