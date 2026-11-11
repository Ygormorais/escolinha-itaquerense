import { describe, expect, it } from "vitest"
import { resumoCategorias } from "@/lib/site/categorias"

describe("resumoCategorias", () => {
  it("lista Sub-7 a Sub-18 em ordem, com idade e modalidades", () => {
    const r = resumoCategorias()
    expect(r.map((c) => c.categoria)).toEqual(["Sub-7", "Sub-9", "Sub-11", "Sub-13", "Sub-15", "Sub-17", "Sub-18"])
    expect(r[0]).toEqual({ categoria: "Sub-7", idade: "5 – 7 anos", escolinha: true, federado: false })
    expect(r.find((c) => c.categoria === "Sub-13")).toMatchObject({ escolinha: true, federado: true })
    expect(r.find((c) => c.categoria === "Sub-18")).toMatchObject({ escolinha: false, federado: true })
  })
})
