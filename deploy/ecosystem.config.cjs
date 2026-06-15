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
  ],
}
