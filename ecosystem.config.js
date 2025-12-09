module.exports = {
  apps: [{
    name: 'b2btasks',
    script: 'npm',
    args: 'start',
    cwd: '/srv/b2btasks',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3009
    },
    // Logging
    error_file: '/srv/b2btasks/logs/error.log',
    out_file: '/srv/b2btasks/logs/out.log',
    log_file: '/srv/b2btasks/logs/combined.log',
    time: true,
    // Restart policy
    restart_delay: 4000,
    exp_backoff_restart_delay: 100,
    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 8000
  }]
};
