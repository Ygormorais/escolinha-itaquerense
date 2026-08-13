import Database from "better-sqlite3"
import { resolveDbPath } from "./db-path"
import type { RateLimitEntry, RateLimitStore } from "./rate-limit-store"

export function createSqliteRateLimitStore(): RateLimitStore {
  const db = new Database(resolveDbPath())
  db.exec(`
    CREATE TABLE IF NOT EXISTS _rate_limit (
      key     TEXT    PRIMARY KEY,
      count   INTEGER NOT NULL,
      reset_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS _rate_limit_reset_at_idx ON _rate_limit(reset_at);
  `)

  const stmtGet = db.prepare<[string], { count: number; reset_at: number }>(
    "SELECT count, reset_at FROM _rate_limit WHERE key = ?"
  )
  const stmtSet = db.prepare(
    "INSERT OR REPLACE INTO _rate_limit (key, count, reset_at) VALUES (?, ?, ?)"
  )
  const stmtIncrement = db.prepare("UPDATE _rate_limit SET count = count + 1 WHERE key = ?")
  const stmtDelete = db.prepare("DELETE FROM _rate_limit WHERE key = ?")
  const stmtPrune = db.prepare("DELETE FROM _rate_limit WHERE reset_at < ?")
  const stmtClear = db.prepare("DELETE FROM _rate_limit")

  const consume = db.transaction((key: string, now: number, windowMs: number): RateLimitEntry => {
    const current = stmtGet.get(key)
    if (!current || now >= current.reset_at) {
      const next = { count: 1, resetAt: now + windowMs }
      stmtSet.run(key, next.count, next.resetAt)
      return next
    }

    stmtIncrement.run(key)
    return { count: current.count + 1, resetAt: current.reset_at }
  })

  return {
    get: (key) => {
      const row = stmtGet.get(key)
      return row ? { count: row.count, resetAt: row.reset_at } : undefined
    },
    set: (key, entry) => {
      stmtSet.run(key, entry.count, entry.resetAt)
    },
    consume,
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
