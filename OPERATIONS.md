# Kalpzero Operations

# ===== IMPORTTANT TO CHECK CONSOLE #######################


### Check PM2 logs

```bash
pm2 logs kalpzero-api
pm2 logs kalpzero-web
```

# ===== IMPORTTANT TO CHECK CONSOLE END #######################




## Repo

- Local path: `/mnt/data/kalpzero-enterprise`
- Git remote: `origin`
- GitHub repo: `https://github.com/hideepakrai/kalpzero-enterprise.git`
- Deploy branch: `main`

- Production deploys are handled by GitHub Actions workflow `.github/workflows/deploy-live.yml`.
- The workflow triggers on pushes to `main` and on manual `workflow_dispatch`.
- The self-hosted runner on this server executes the deploy steps against `/mnt/data/kalpzero-enterprise`.
- `scripts/auto-deploy-live.sh` is the commit-check wrapper used by the workflow.
- `scripts/deploy-live.sh` is the actual deploy script. It can force-sync the checkout to `origin/main`, install dependencies, build the workspace, restart `kalpzero-api` and `kalpzero-web`, and run health checks.
- Auto-deploy log file:
  - `/tmp/kalpzero-auto-deploy.log`
- Auto-deploy lock file:
  - `/tmp/kalpzero-auto-deploy.lock`

Important:

- There is no cron-based production deploy for this repo.
- There is no PM2 watcher for production deploys.
- The old `kalpzero-auto-deploy-debug` process has been removed. Use GitHub Actions as the source of truth.
- `scripts/auto-deploy-debug.sh` remains available only as a manual foreground diagnostic helper.

## How To Check The Live Deploy System

### Check the latest GitHub Actions deploy run

```bash
gh run list --repo hideepakrai/kalpzero-enterprise --workflow deploy-live.yml --limit 5
```

### Inspect a specific deploy run

```bash
gh run view <run-id> --repo hideepakrai/kalpzero-enterprise
```

### Watch the local deploy log

```bash
tail -n 50 /tmp/kalpzero-auto-deploy.log
```

Useful log messages:

- `No new commit detected` means the checkout already matches `origin/main`.
- `Repository differs from remote. Force-sync deployment will run.` means the workflow is about to sync and deploy.
- `Repository now at commit` shows the deployed SHA.
- `Deploy completed successfully` means install, build, restart, and health checks passed.

### Check the live PM2 apps

```bash
pm2 list
pm2 show kalpzero-api
pm2 show kalpzero-web
pm2 logs kalpzero-api --lines 50
pm2 logs kalpzero-web --lines 50
```

### Confirm no cron deploy exists

```bash
crontab -l | grep auto-deploy-live.sh
```

- This should return no output.

### Manual foreground debug check

```bash
cd /mnt/data/kalpzero-enterprise
./scripts/auto-deploy-debug.sh --once
```

- This is only for debugging the deploy scripts locally.
- It is not the production auto-deploy path.

### Compare the deployed commit with the remote branch

```bash
cd /mnt/data/kalpzero-enterprise
git fetch origin main
git rev-parse HEAD
git rev-parse FETCH_HEAD
```

- If both SHAs match, the live checkout is already on the latest `origin/main` commit.
- If they differ, the workflow either has not run yet or failed mid-deploy.

### Check the current local commit quickly

```bash
cd /mnt/data/kalpzero-enterprise
git log -1 --oneline
```

## Running Ports

These ports come from `ecosystem.config.cjs`.

- Backend PM2 app: `kalpzero-api`
  - Host: `127.0.0.1`
  - Port: `8012`
  - Health check: `http://127.0.0.1:8012/health/live`
- Frontend PM2 app: `kalpzero-web`
  - Host: `127.0.0.1`
  - Port: `3002`
  - Quick check: `http://127.0.0.1:3002/login`
- Public frontend URL: `https://kalptree.xyz/login`
- Public API base URL: `https://kalptree.xyz/api`

## Domain And Nginx / Proxy Details

### Active public domain

- Primary public domain: `kalptree.xyz`
- Active Nginx site file: `/etc/nginx/sites-available/kalptree.xyz`
- Enabled symlink: `/etc/nginx/sites-enabled/kalptree.xyz`

### Current request flow

- Public HTTPS requests for `https://kalptree.xyz` hit Nginx first.
- Nginx routes `/` directly to `http://127.0.0.1:3002`.
- Nginx routes `/api/...` directly to `http://127.0.0.1:8012`.
- Port `8012` is served by PM2 app `kalpzero-api`.
- Port `3002` is served by PM2 app `kalpzero-web`.

### SSL / Certbot

- Certificate file: `/etc/letsencrypt/live/kalptree.xyz/fullchain.pem`
- Private key file: `/etc/letsencrypt/live/kalptree.xyz/privkey.pem`

### Tenant Domains And SSL

- Self-hosted business websites still run through the shared frontend on `127.0.0.1:3002`.
- Per-domain Nginx and Certbot activation is handled by the root-owned wrapper:
  - `/usr/local/sbin/kalpzero-domain-provision`
- The app user should only be allowed to run that one command through sudo:
  - `/etc/sudoers.d/kalpzero-domain-provision`
- The repo installer that writes both files is:
  - `scripts/install-domain-automation.sh`

One-time install:

```bash
cd /mnt/data/kalpzero-enterprise
sudo ./scripts/install-domain-automation.sh dzinly
```

After that, platform onboarding and the tenant website sync endpoint can provision:
- an Nginx host config for the tenant domain
- a Let’s Encrypt certificate via Certbot webroot validation
- HTTPS proxying for both `/` and `/api/`

### Important note about `/api`

- `kalptree.xyz/api/...` is handled by the Nginx site file at `/etc/nginx/sites-available/kalptree.xyz`.
- The Nginx `location /api/` block strips the `/api/` prefix before forwarding to the backend on `8012`.
- In PM2 config, the frontend is configured with:
  - `KALPZERO_INTERNAL_API_URL=http://127.0.0.1:8012`
  - `KALPZERO_API_PROXY_URL=http://127.0.0.1:8012`
  - `KALPZERO_PUBLIC_API_URL=https://kalptree.xyz/api`
  - `NEXT_PUBLIC_API_BASE_URL=/api`
  - `NEXT_PUBLIC_KALPZERO_API_URL=/api`
- Browser requests on the live site should go to `/api/...` or `https://kalptree.xyz/api/...`.
- If you see `http://127.0.0.1:8000/...` in the browser on the live site, the frontend bundle is stale or the browser cached old JS.

### Quick Live Verification

```bash
curl -sS http://127.0.0.1:8012/health/live
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3002/login
curl -sS -o /dev/null -w "%{http_code}\n" --resolve kalptree.xyz:443:127.0.0.1 https://kalptree.xyz/login
curl -sS --resolve kalptree.xyz:443:127.0.0.1 https://kalptree.xyz/api/health/live
```

### Legacy domain still present on this machine

- Legacy Nginx site file: `/etc/nginx/sites-available/kalptree`
- Domain: `kalptree.theworldstreet.in`
- That site also proxies traffic to this repo's frontend on `http://127.0.0.1:3002`

## PM2 Processes

PM2 process names used for this repo:

- `kalpzero-api`
- `kalpzero-web`

### Check PM2 status

```bash
pm2 list
pm2 show kalpzero-api
pm2 show kalpzero-web
```

### Check PM2 logs

```bash
pm2 logs kalpzero-api
pm2 logs kalpzero-web
```

### Check Nginx status and config

```bash
sudo nginx -t
sudo systemctl status nginx
cat /etc/nginx/sites-available/kalptree.xyz
cat /etc/nginx/sites-available/kalptree
```

### Restart PM2 apps manually

```bash
pm2 restart kalpzero-api
pm2 restart kalpzero-web
pm2 save
```

## Manual Deploy

If you want to deploy immediately from the current checkout:

```bash
cd /mnt/data/kalpzero-enterprise
./scripts/deploy-live.sh
```

If the checkout is already correct and you only want rebuild/restart without another git pull:

```bash
cd /mnt/data/kalpzero-enterprise
./scripts/deploy-live.sh --skip-pull
```

If you only want to run the commit-check wrapper manually:

```bash
cd /mnt/data/kalpzero-enterprise
./scripts/auto-deploy-live.sh
```
