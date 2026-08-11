import { CheckinClient } from "./checkin-client"
import { verifyCheckinToken } from "@/lib/checkin-token"
import { notFound } from "next/navigation"

export const metadata = { title: "Check-in — Escolinha Itaquerense" }

export default async function CheckinPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; ok?: string; ja?: string; erro?: string }>
}) {
  const params = await searchParams
  const token = params.token ?? ""
  const claims = verifyCheckinToken(token)
  if (!claims) notFound()

  return (
    <CheckinClient
      turma={claims.turma}
      data={claims.data}
      token={token}
      ok={params.ok === "1"}
      jaRegistrado={params.ja === "1"}
      erro={params.erro ?? null}
    />
  )
}
