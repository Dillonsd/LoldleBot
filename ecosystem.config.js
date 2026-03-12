module.exports = {
  apps: [
    {
      name: "discord-loldle",
      script: "dist/index.js",
      env: {
        NODE_ENV: "production",
      },
      restart_delay: 5000,
      max_restarts: 10,
    },
  ],
};
