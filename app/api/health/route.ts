export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { db } from "@/lib/db"

const START = Date.now()

/** Health check público para PM2/Caddy/uptime monitor: app vivo + banco acessível. */
export async function GET() {
  const uptime = Math.floor((Date.now() - START) / 1000)
  try {
    await db.$queryRaw`SELECT 1`
    return NextResponse.json({ status: "ok", db: "ok", uptime, env: process.env.NODE_ENV })
  } catch {
    return NextResponse.json({ status: "degraded", db: "error", uptime, env: process.env.NODE_ENV }, { status: 503 })
  }
}
