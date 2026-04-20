module.exports = {
    apps: [
        {
            name: 'gregmat-server',
            script: './build/src/app.js',
            instances: 2, // Use all available CPU cores
            exec_mode: 'cluster',
            max_memory_restart: '2G', // Increased from 1G to 2G
            autorestart: true,
            watch: false,
            max_restarts: 10,
            min_uptime: '10s',
            out_file: './logs/out.log',
            error_file: './logs/error.log',
            log_file: './logs/combined.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,
            kill_timeout: 5000,
            listen_timeout: 3000,
            shutdown_with_message: true,
            // Performance optimizations
            node_args: '--max-old-space-size=2048', // Allow Node to use 2GB heap
            env_production: {
                NODE_ENV: 'production',
                PORT: 5100,
                UV_THREADPOOL_SIZE: 128, // Increase libuv thread pool for I/O operations
            },
        },
    ],
};
