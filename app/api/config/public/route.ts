export const dynamic = "force-dynamic"

import { getConfig } from "@/lib/config"

export async function GET() {
  const config = getConfig()
  return Response.json({ whatsapp: config.whatsapp })
}
