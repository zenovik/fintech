/**
 * PM2 ecosystem configuration for production deployment.
 *
 * Usage:
 *   npm run build:prod
 *   pm2 start ecosystem.config.cjs --env production
 *   pm2 reload ecosystem.config.cjs --env production
 *   pm2 save
 */
module.exports = {
  apps: [
    {
      name: 'fintech-backend',
      script: 'dist/server.js',
      cwd: './Backend_Fintech',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      kill_timeout: 10000,
      listen_timeout: 10000,
      wait_ready: true,
      shutdown_with_message: true,
      max_restarts: 10,
      min_uptime: 5000,
      env_production: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info',
      },
      error_file: './Backend_Fintech/logs/pm2-error.log',
      out_file: './Backend_Fintech/logs/pm2-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
