export type ImageKind = "jpeg" | "png" | "webp"

const SIGNATURES: { kind: ImageKind; bytes: number[]; offset?: number }[] = [
  { kind: "jpeg", bytes: [0xff, 0xd8, 0xff] },
  { kind: "png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { kind: "webp", bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 },
]

export function detectImageKind(buffer: Uint8Array): ImageKind | null {
  for (const { kind, bytes, offset = 0 } of SIGNATURES) {
    if (buffer.length < offset + bytes.length) continue
    const match = bytes.every((b, i) => buffer[offset + i] === b)
    if (match) return kind
  }
  return null
}

export function extensionForKind(kind: ImageKind): string {
  return kind === "jpeg" ? "jpg" : kind
}

export function mimeForKind(kind: ImageKind): string {
  if (kind === "jpeg") return "image/jpeg"
  if (kind === "png") return "image/png"
  return "image/webp"
}
