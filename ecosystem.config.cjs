module.exports = {
  apps: [
    {
      name: "kalpzero-api",
      cwd: "/mnt/data/kalpzero-enterprise/apps/api",
      script: "./.venv/bin/uvicorn",
      args: "app.main:app --host 127.0.0.1 --port 8012",
      interpreter: "none",
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 10,
      env: {
        KALPZERO_PUBLIC_WEB_URL: "https://kalptree.xyz",
        KALPZERO_PUBLIC_API_URL: "https://kalptree.xyz/api"
      }
    },
    {
      name: "kalpzero-web",
      cwd: "/mnt/data/kalpzero-enterprise/apps/web",
      script: "pnpm",
      args: "run start -- --hostname 127.0.0.1 --port 3002",
      interpreter: "none",
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
        KALPZERO_INTERNAL_API_URL: "http://127.0.0.1:8012",
        KALPZERO_API_PROXY_URL: "http://127.0.0.1:8012",
        KALPZERO_PUBLIC_API_URL: "https://kalptree.xyz/api",
        NEXT_PUBLIC_API_BASE_URL: "/api",
        NEXT_PUBLIC_KALPZERO_API_URL: "/api"
      }
    }
  ]
};
