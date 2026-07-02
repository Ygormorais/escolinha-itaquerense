import Database from "better-sqlite3"
import { resolveDbPath } from "./db-path"
import type { RateLimitStore } from "./rate-limit-store"

export function createSqliteRateLimitStore(): RateLimitStore {
  const db = new Database(resolveDbPath())
  db.exec(`
    CREATE TABLE IF NOT EXISTS _rate_limit (
      key     TEXT    PRIMARY KEY,
      count   INTEGER NOT NULL,
      reset_at INTEGER NOT NULL
    )
  `)

  const stmtGet = db.prepare<[string], { count: number; reset_at: number }>(
    "SELECT count, reset_at FROM _rate_limit WHERE key = ?"
  )
  const stmtSet = db.prepare(
    "INSERT OR REPLACE INTO _rate_limit (key, count, reset_at) VALUES (?, ?, ?)"
  )
  const stmtDelete = db.prepare("DELETE FROM _rate_limit WHERE key = ?")
  const stmtPrune = db.prepare("DELETE FROM _rate_limit WHERE reset_at < ?")
  const stmtClear = db.prepare("DELETE FROM _rate_limit")

  return {
    get: (key) => {
      const row = stmtGet.get(key)
      return row ? { count: row.count, resetAt: row.reset_at } : undefined
    },
    set: (key, entry) => {
      stmtSet.run(key, entry.count, entry.resetAt)
    },
    delete: (key) => {
      stmtDelete.run(key)
    },
    prune: (now) => {
      stmtPrune.run(now)
    },
    clear: () => {
      stmtClear.run()
    },
  }
}
