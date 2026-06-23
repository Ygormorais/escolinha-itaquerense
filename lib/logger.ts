type LogLevel = "info" | "warn" | "error"

interface LogEntry {
  level: LogLevel
  message: string
  ts: string
  [key: string]: unknown
}

function write(level: LogLevel, message: string, ctx?: Record<string, unknown>) {
  const entry: LogEntry = { level, message, ts: new Date().toISOString(), ...ctx }
  const line = JSON.stringify(entry)
  if (level === "error") {
    process.stderr.write(line + "\n")
  } else {
    process.stdout.write(line + "\n")
  }
}

export const logger = {
  info:  (msg: string, ctx?: Record<string, unknown>) => write("info",  msg, ctx),
  warn:  (msg: string, ctx?: Record<string, unknown>) => write("warn",  msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => write("error", msg, ctx),
}
