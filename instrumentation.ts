export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { iniciarSyncAutomatico } = await import("@/lib/fpfs/auto-sync")
    iniciarSyncAutomatico()
  }
}
