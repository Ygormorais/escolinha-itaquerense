import { describe, it, expect } from "vitest"
import { can, roleLabel, ROLES } from "@/lib/auth"

describe("permissions", () => {
  describe("can()", () => {
    it("admin can do anything", () => {
      expect(can("admin")).toBe(true)
      expect(can("admin", "secretaria")).toBe(true)
      expect(can("admin", "tecnico")).toBe(true)
    })

    it("secretaria can do secretaria-level actions", () => {
      expect(can("secretaria", "secretaria")).toBe(true)
      expect(can("secretaria", "tecnico")).toBe(false)
    })

    it("tecnico can only do tecnico-level actions", () => {
      expect(can("tecnico", "tecnico")).toBe(true)
      expect(can("tecnico", "secretaria")).toBe(false)
    })

    it("undefined role returns false", () => {
      expect(can(undefined)).toBe(false)
      expect(can(undefined, "admin")).toBe(false)
    })

    it("empty allowed roles defaults to deny for non-admin", () => {
      expect(can("tecnico")).toBe(false)
    })
  })

  describe("roleLabel()", () => {
    it("returns label for known roles", () => {
      expect(roleLabel("admin")).toBe("Administrador")
      expect(roleLabel("secretaria")).toBe("Secretaria")
      expect(roleLabel("tecnico")).toBe("Técnico")
    })

    it("returns the role itself for unknown roles", () => {
      expect(roleLabel("unknown")).toBe("unknown")
    })
  })

  describe("ROLES", () => {
    it("has all three roles", () => {
      const values = ROLES.map((r) => r.value)
      expect(values).toContain("admin")
      expect(values).toContain("secretaria")
      expect(values).toContain("tecnico")
    })
  })
})
