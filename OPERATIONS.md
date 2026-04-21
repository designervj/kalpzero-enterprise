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

## Auto Pull / Auto Deploy

- Primary watcher runs under PM2:
  - `kalpzero-auto-deploy-debug`
- PM2 watcher command:
  - `pm2 start /mnt/data/kalpzero-enterprise/scripts/auto-deploy-debug.sh --name kalpzero-auto-deploy-debug --interpreter bash -- --interval=60`
- Cron for this repo is intentionally disabled now so only one watcher controls deploy checks.
- Script that checks whether a new commit exists on `origin/main`:
  - `scripts/auto-deploy-live.sh`
- Foreground debug watcher script:
  - `scripts/auto-deploy-debug.sh`
- Script that performs the actual deploy when a new commit is found:
  - `scripts/deploy-live.sh`
- Auto-deploy log file:
  - `/tmp/kalpzero-auto-deploy.log`
- Auto-deploy lock file:
  - `/tmp/kalpzero-auto-deploy.lock`

## How To Check The Running Watcher

### Main live terminal command

```bash
pm2 logs kalpzero-auto-deploy-debug
```

- This is the main command to watch fetch, SHA comparison, and deploy output live.
- Leave it open in a terminal if you want to monitor auto-pull behavior continuously.

### Check watcher status

```bash
pm2 list
pm2 show kalpzero-auto-deploy-debug
```

### Check PM2 log files directly

```bash
tail -f /home/dzinly/.pm2/logs/kalpzero-auto-deploy-debug-out.log
tail -f /home/dzinly/.pm2/logs/kalpzero-auto-deploy-debug-error.log
```

## How To Check The Cron Job

Cron is disabled for this repo on purpose.

### Check that the cron entry exists

```bash
crontab -l
```

Expected result:

```bash
no line for /mnt/data/kalpzero-enterprise/scripts/auto-deploy-live.sh
```

### Check that the cron service itself is running

```bash
systemctl status cron
```

### If you want to confirm cron is not handling this repo anymore

```bash
crontab -l | grep auto-deploy-live.sh
```

- This should return no output.
- The deploy checks should now come from the PM2 watcher instead of cron.

### Quick one-line checks

```bash
pm2 logs kalpzero-auto-deploy-debug --lines 50
tail -n 20 /home/dzinly/.pm2/logs/kalpzero-auto-deploy-debug-out.log
```

### Run the auto-deploy checker in a terminal with live debug output

```bash
cd /mnt/data/kalpzero-enterprise
./scripts/auto-deploy-debug.sh
```

- This keeps running in the terminal.
- It shows each check, local SHA, remote SHA, and whether a new commit is being pulled.
- If a deploy starts, you will see the pull/build/restart logs directly in the same terminal.
- Stop it with `Ctrl+C`.

### Run only one debug check

```bash
cd /mnt/data/kalpzero-enterprise
./scripts/auto-deploy-debug.sh --once
```

### Run debug checks faster than cron

```bash
cd /mnt/data/kalpzero-enterprise
./scripts/auto-deploy-debug.sh --interval=15
```

- This is useful when you want to test push/pull behavior quickly without waiting a full minute.

## How To Check If The Latest Commit Was Pulled

### Check the auto-deploy log

```bash
tail -n 50 /tmp/kalpzero-auto-deploy.log
```

Useful log messages:

- `No new commit detected` means the server already matches `origin/main`.
- `New remote commit detected` means a newer commit was found on GitHub and deploy should start.
- `Local repo is ahead of origin/main` means this folder already has commits that GitHub does not have yet, so there is nothing to pull.
- `Local and remote have diverged` means manual intervention is required before auto-deploy should continue.
- `Auto-deploy completed` means pull/build/restart finished successfully.

Important note:

- If you ran `git push origin main` from `/mnt/data/kalpzero-enterprise` itself, this folder already has the latest commit.
- In that case the cron log will usually show `No new commit detected`, because there is nothing left to pull.

### Compare local commit with remote commit

```bash
cd /mnt/data/kalpzero-enterprise
git fetch origin main
git rev-parse HEAD
git rev-parse FETCH_HEAD
```

- If both commit SHAs are the same, the latest commit is already pulled.
- If they are different, the server is behind the remote branch.

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

If you want to deploy immediately without waiting for the watcher:

```bash
cd /mnt/data/kalpzero-enterprise
./scripts/deploy-live.sh
```

If you only want to run the commit check wrapper manually:

```bash
cd /mnt/data/kalpzero-enterprise
./scripts/auto-deploy-live.sh
```
