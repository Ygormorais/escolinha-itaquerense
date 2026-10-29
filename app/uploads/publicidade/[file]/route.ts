export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"
import { resolveUploadsDir } from "@/lib/uploads-path"

const CONTENT_TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" }

/** Banners de publicidade: públicos (aparecem no site para qualquer visitante). */
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params
  if (path.basename(file) !== file || !/^[a-f0-9-]+\.(jpg|png|webp)$/i.test(file)) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  }
  const ext = file.split(".").pop()!.toLowerCase()
  try {
    const bytes = await readFile(path.join(/* turbopackIgnore: true */ resolveUploadsDir("publicidade"), file))
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": CONTENT_TYPES[ext],
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
        // Nome é UUID novo a cada envio: o arquivo nunca muda, pode ficar em cache.
        "Cache-Control": "public, max-age=604800, immutable",
      },
    })
  } catch {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  }
}
