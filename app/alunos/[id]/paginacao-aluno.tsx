"use client"

import { useRouter } from "next/navigation"
import { Pagination } from "@/components/ui/pagination"

export function PaginacaoAluno({
  alunoId,
  page,
  totalPages,
}: {
  alunoId: number
  page: number
  totalPages: number
}) {
  const router = useRouter()

  function handlePageChange(p: number) {
    router.push(`/alunos/${alunoId}${p > 1 ? `?pagina=${p}` : ""}`)
  }

  return <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
}
