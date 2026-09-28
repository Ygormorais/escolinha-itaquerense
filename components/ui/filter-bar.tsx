"use client"

import * as React from "react"
import { SlidersHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Sheet } from "@/components/ui/sheet"

interface FilterBarSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  "aria-label"?: string
}

interface FilterBarProps {
  search?: FilterBarSearchProps
  /** Um Select (ou outro controle) já montado pelo consumidor por filtro. */
  filters?: React.ReactNode[]
  /** Rótulo do botão que abre os filtros no mobile. */
  filtersLabel?: string
  /** Quantos filtros estão fora do valor padrão; vira badge no botão mobile. */
  activeFiltersCount?: number
  /** Botões secundários (exportar, importar, etc). */
  actions?: React.ReactNode
  className?: string
}

/**
 * Barra de busca + filtros + ações secundárias, responsiva.
 * Mobile: busca ocupa a linha inteira; filtros colapsam num Sheet
 * ("Filtros") em vez de empilhar N campos; ações ficam em linha própria.
 * Desktop (md+): busca, filtros e ações dividem uma única linha.
 */
function FilterBar({
  search,
  filters,
  filtersLabel = "Filtros",
  activeFiltersCount,
  actions,
  className,
}: FilterBarProps) {
  const [filtersOpen, setFiltersOpen] = React.useState(false)
  const hasFilters = !!filters && filters.length > 0

  return (
    <div
      data-slot="filter-bar"
      className={cn(
        "rounded-[var(--radius-card)] border bg-card p-4 shadow-[var(--shadow-xs)]",
        className
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        {search && (
          <div className="min-w-0 flex-1 space-y-1.5">
            <Input
              type="search"
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              placeholder={search.placeholder ?? "Buscar..."}
              aria-label={search["aria-label"] ?? search.placeholder ?? "Buscar"}
            />
          </div>
        )}

        {hasFilters && (
          <>
            <Button
              type="button"
              variant="outline"
              className="w-full shrink-0 md:hidden"
              onClick={() => setFiltersOpen(true)}
            >
              <SlidersHorizontal className="size-4" />
              {filtersLabel}
              {!!activeFiltersCount && (
                <span className="ml-1 inline-flex size-5 items-center justify-center rounded-[var(--radius-pill)] bg-primary text-xs text-primary-foreground">
                  {activeFiltersCount}
                </span>
              )}
            </Button>

            <div className="hidden min-w-0 flex-wrap items-end gap-2 md:flex">
              {filters.map((filter, index) => (
                <div key={index} className="min-w-0">
                  {filter}
                </div>
              ))}
            </div>
          </>
        )}

        {actions && (
          <div className="flex flex-wrap items-end gap-2 md:ml-auto md:shrink-0">
            {actions}
          </div>
        )}
      </div>

      {hasFilters && (
        <Sheet open={filtersOpen} onClose={() => setFiltersOpen(false)} side="right">
          <div className="flex flex-col gap-4 overflow-y-auto p-4 pt-14">
            <h2 className="text-sm font-semibold text-foreground">{filtersLabel}</h2>
            {filters.map((filter, index) => (
              <div key={index} className="min-w-0">
                {filter}
              </div>
            ))}
            <Button type="button" onClick={() => setFiltersOpen(false)} className="mt-2">
              Aplicar
            </Button>
          </div>
        </Sheet>
      )}
    </div>
  )
}

export { FilterBar }
export type { FilterBarProps }
