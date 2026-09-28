"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface DataTableColumn<T> {
  /** Chave estável da coluna (usada como React key do header/célula). */
  id: string
  header: React.ReactNode
  /** Renderiza o conteúdo da célula a partir da linha. */
  cell: (row: T) => React.ReactNode
  /** Classe aplicada em `TableHead`/`TableCell` (ex.: alinhamento, largura). */
  className?: string
  /** Rótulo curto usado na alternativa mobile (card). Se omitido, usa `header`. */
  mobileLabel?: React.ReactNode
  /** Oculta a coluna na alternativa mobile (ex.: coluna já representada no título do card). */
  hideOnMobile?: boolean
}

export interface DataTableEmptyState {
  title: string
  description?: string
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  getRowId: (row: T) => string
  selectable?: boolean
  selectedIds?: Set<string>
  onSelectionChange?: (selectedIds: Set<string>) => void
  rowActions?: (row: T) => React.ReactNode
  /** Desabilita a checkbox de seleção para uma linha específica (ex.: já paga). */
  isRowSelectable?: (row: T) => boolean
  /** Rótulo específico da linha (ex.: nome do aluno) para o aria-label do checkbox de seleção. Se omitido, usa rótulo genérico "Selecionar item". */
  getRowLabel?: (row: T) => string
  emptyState?: DataTableEmptyState
  className?: string
}

export function DataTable<T>({
  columns,
  data,
  getRowId,
  selectable = false,
  selectedIds,
  onSelectionChange,
  rowActions,
  isRowSelectable,
  getRowLabel,
  emptyState,
  className,
}: DataTableProps<T>) {
  const selectableRows = React.useMemo(
    () => data.filter((row) => !isRowSelectable || isRowSelectable(row)),
    [data, isRowSelectable]
  )
  const selectableIds = React.useMemo(
    () => new Set(selectableRows.map(getRowId)),
    [selectableRows, getRowId]
  )
  const allSelected =
    selectable &&
    selectableIds.size > 0 &&
    Array.from(selectableIds).every((id) => selectedIds?.has(id))

  function toggleAll() {
    if (!onSelectionChange) return
    if (allSelected) {
      onSelectionChange(new Set())
    } else {
      onSelectionChange(new Set(selectableIds))
    }
  }

  function toggleRow(id: string) {
    if (!onSelectionChange || !selectedIds) return
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    onSelectionChange(next)
  }

  if (data.length === 0 && emptyState) {
    return (
      <EmptyState
        title={emptyState.title}
        description={emptyState.description}
        className={className}
      />
    )
  }

  return (
    <div data-slot="data-table" className={className}>
      {/* Mobile: lista de cards, sem tabela HTML */}
      <div data-slot="data-table-mobile" className="grid gap-3 md:hidden">
        {data.map((row) => {
          const id = getRowId(row)
          const canSelect = !isRowSelectable || isRowSelectable(row)
          return (
            <Card
              key={id}
              size="sm"
              data-slot="data-table-mobile-card"
              className={cn(
                "gap-3 p-4",
                selectable && selectedIds?.has(id) && "border-brand-300 bg-brand-50 dark:bg-brand-950/30"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                {selectable && (
                  <input
                    type="checkbox"
                    checked={selectedIds?.has(id) ?? false}
                    disabled={!canSelect}
                    onChange={() => toggleRow(id)}
                    aria-label={getRowLabel ? `Selecionar ${getRowLabel(row)}` : "Selecionar item"}
                    className="mt-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                  />
                )}
                <dl className="grid min-w-0 flex-1 grid-cols-2 gap-3 text-sm">
                  {columns
                    .filter((column) => !column.hideOnMobile)
                    .map((column) => (
                      <div key={column.id} className="min-w-0">
                        <dt className="text-xs text-muted-foreground">
                          {column.mobileLabel ?? column.header}
                        </dt>
                        <dd className="truncate font-medium">{column.cell(row)}</dd>
                      </div>
                    ))}
                </dl>
              </div>
              {rowActions && (
                <div className="flex justify-end gap-2 border-t pt-3">
                  {rowActions(row)}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Desktop: tabela */}
      <div
        data-slot="data-table-desktop"
        className="hidden overflow-x-auto rounded-[var(--radius-card)] border bg-card shadow-sm md:block"
      >
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-8">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Selecionar todos"
                    className="cursor-pointer"
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead key={column.id} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
              {rowActions && <TableHead className="w-28 text-right">Ação</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => {
              const id = getRowId(row)
              const canSelect = !isRowSelectable || isRowSelectable(row)
              const isSelected = selectable && (selectedIds?.has(id) ?? false)
              return (
                <TableRow
                  key={id}
                  data-state={isSelected ? "selected" : undefined}
                >
                  {selectable && (
                    <TableCell>
                      {canSelect && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(id)}
                          aria-label={getRowLabel ? `Selecionar ${getRowLabel(row)}` : "Selecionar item"}
                          className="cursor-pointer"
                        />
                      )}
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={column.id} className={column.className}>
                      {column.cell(row)}
                    </TableCell>
                  ))}
                  {rowActions && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">{rowActions(row)}</div>
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
