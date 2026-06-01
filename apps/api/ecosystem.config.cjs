/** @type {import('pm2').StartOptions} */
module.exports = {
  apps: [
    {
      name: 'rateq-api',
      script: 'dist/main.js',
      cwd: __dirname,
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
    },
  ],
};
