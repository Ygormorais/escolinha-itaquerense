import { describe, it, expect, beforeEach } from "vitest"
import { createSqliteRateLimitStore } from "../rate-limit-store-sqlite"

describe("createSqliteRateLimitStore", () => {
  let store: ReturnType<typeof createSqliteRateLimitStore>

  beforeEach(() => {
    store = createSqliteRateLimitStore()
    store.clear()
  })

  it("set e get retornam a mesma entrada", () => {
    const entry = { count: 1, resetAt: Date.now() + 60_000 }
    store.set("ip:1.2.3.4", entry)
    expect(store.get("ip:1.2.3.4")).toEqual(entry)
  })

  it("get retorna undefined para chave inexistente", () => {
    expect(store.get("ip:0.0.0.0")).toBeUndefined()
  })

  it("delete remove a entrada", () => {
    store.set("k", { count: 1, resetAt: Date.now() + 1000 })
    store.delete("k")
    expect(store.get("k")).toBeUndefined()
  })

  it("set substitui entrada existente (upsert)", () => {
    store.set("k", { count: 1, resetAt: Date.now() + 1000 })
    store.set("k", { count: 5, resetAt: Date.now() + 2000 })
    expect(store.get("k")?.count).toBe(5)
  })

  it("prune remove entradas expiradas e preserva válidas", () => {
    const now = Date.now()
    store.set("expirada", { count: 3, resetAt: now - 1 })
    store.set("valida", { count: 1, resetAt: now + 60_000 })
    store.prune(now)
    expect(store.get("expirada")).toBeUndefined()
    expect(store.get("valida")).toBeDefined()
  })

  it("prune não remove entradas com resetAt igual a now", () => {
    const now = Date.now()
    store.set("borda", { count: 1, resetAt: now })
    store.prune(now)
    expect(store.get("borda")).toBeDefined()
  })

  it("clear remove todas as entradas", () => {
    store.set("a", { count: 1, resetAt: Date.now() + 1000 })
    store.set("b", { count: 2, resetAt: Date.now() + 1000 })
    store.clear()
    expect(store.get("a")).toBeUndefined()
    expect(store.get("b")).toBeUndefined()
  })
})
