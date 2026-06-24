import { describe, it, expect } from "vitest"
import { createMemoryRateLimitStore } from "../rate-limit-store"

describe("createMemoryRateLimitStore", () => {
  it("set e get retornam a mesma entrada", () => {
    const store = createMemoryRateLimitStore()
    const entry = { count: 1, resetAt: Date.now() + 60_000 }
    store.set("ip:1.2.3.4", entry)
    expect(store.get("ip:1.2.3.4")).toEqual(entry)
  })

  it("get retorna undefined para chave inexistente", () => {
    const store = createMemoryRateLimitStore()
    expect(store.get("ip:0.0.0.0")).toBeUndefined()
  })

  it("delete remove a entrada", () => {
    const store = createMemoryRateLimitStore()
    store.set("k", { count: 1, resetAt: Date.now() + 1000 })
    store.delete("k")
    expect(store.get("k")).toBeUndefined()
  })

  it("prune remove entradas expiradas e preserva válidas", () => {
    const store = createMemoryRateLimitStore()
    const now = Date.now()
    store.set("expirada", { count: 3, resetAt: now - 1 })
    store.set("valida", { count: 1, resetAt: now + 60_000 })
    store.prune(now)
    expect(store.get("expirada")).toBeUndefined()
    expect(store.get("valida")).toBeDefined()
  })

  it("prune não remove entradas com resetAt igual a now", () => {
    const store = createMemoryRateLimitStore()
    const now = Date.now()
    store.set("borda", { count: 1, resetAt: now })
    store.prune(now)
    // resetAt === now: condição é now > resetAt (estrito), então NÃO remove
    expect(store.get("borda")).toBeDefined()
  })

  it("clear remove todas as entradas", () => {
    const store = createMemoryRateLimitStore()
    store.set("a", { count: 1, resetAt: Date.now() + 1000 })
    store.set("b", { count: 2, resetAt: Date.now() + 1000 })
    store.clear()
    expect(store.get("a")).toBeUndefined()
    expect(store.get("b")).toBeUndefined()
  })

  it("instâncias são independentes", () => {
    const s1 = createMemoryRateLimitStore()
    const s2 = createMemoryRateLimitStore()
    s1.set("k", { count: 5, resetAt: Date.now() + 1000 })
    expect(s2.get("k")).toBeUndefined()
  })
})
