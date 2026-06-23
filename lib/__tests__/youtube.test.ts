import { describe, it, expect } from "vitest"
import { extractYoutubeId, isYoutubeUrl, getYoutubeThumbnail, getYoutubeEmbedUrl } from "@/lib/youtube"

describe("extractYoutubeId", () => {
  it("extrai ID de URL watch", () => {
    expect(extractYoutubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ")
  })

  it("extrai ID de URL curta youtu.be", () => {
    expect(extractYoutubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ")
  })

  it("extrai ID de URL embed", () => {
    expect(extractYoutubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ")
  })

  it("extrai ID de URL shorts", () => {
    expect(extractYoutubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ")
  })

  it("aceita ID puro de 11 caracteres", () => {
    expect(extractYoutubeId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ")
  })

  it("retorna null para URL inválida", () => {
    expect(extractYoutubeId("https://vimeo.com/123")).toBeNull()
    expect(extractYoutubeId("")).toBeNull()
    expect(extractYoutubeId("nao-e-url")).toBeNull()
  })
})

describe("isYoutubeUrl", () => {
  it("retorna true para URLs válidas do YouTube", () => {
    expect(isYoutubeUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(true)
  })

  it("retorna false para URLs inválidas", () => {
    expect(isYoutubeUrl("https://vimeo.com/123")).toBe(false)
  })
})

describe("getYoutubeThumbnail", () => {
  it("retorna URL de thumbnail correta", () => {
    expect(getYoutubeThumbnail("dQw4w9WgXcQ")).toBe("https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg")
  })
})

describe("getYoutubeEmbedUrl", () => {
  it("retorna URL embed correta", () => {
    expect(getYoutubeEmbedUrl("dQw4w9WgXcQ")).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ")
  })
})
