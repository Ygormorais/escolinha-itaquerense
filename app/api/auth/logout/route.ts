export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { cookieName } from "@/lib/session"

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(cookieName(), "", { maxAge: 0, path: "/" })
  return response
}
