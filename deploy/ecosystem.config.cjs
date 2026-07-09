module.exports = {
  apps: [
    {
      name: "escolinha",
      cwd: __dirname + "/..",
      script: "npm",
      args: "start",
      env: { NODE_ENV: "production", TZ: "UTC" },
      max_restarts: 10,
      restart_delay: 5000,
    },
    // Sync automático FPFS a cada 2h (jogos/classificação → site)
    {
      name: "escolinha-fpfs",
      cwd: __dirname + "/..",
      script: "npx",
      args: "tsx scripts/fpfs-daemon.ts",
      env: { NODE_ENV: "production", TZ: "America/Sao_Paulo" },
      max_restarts: 10,
      restart_delay: 10000,
      autorestart: true,
    },
  ],
}
