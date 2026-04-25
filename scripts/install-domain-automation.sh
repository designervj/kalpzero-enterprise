#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this installer as root." >&2
  exit 1
fi

APP_USER="${1:-${SUDO_USER:-dzinly}}"
PROVISIONER_PATH="/usr/local/sbin/kalpzero-domain-provision"
SUDOERS_PATH="/etc/sudoers.d/kalpzero-domain-provision"
ACME_WEBROOT="/var/www/kalpzero-acme"

install -d -m 0755 /usr/local/sbin
install -d -m 0755 "${ACME_WEBROOT}"

cat > "${PROVISIONER_PATH}" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

HOST=""
WEB_UPSTREAM=""
API_UPSTREAM=""
EMAIL=""
ACME_WEBROOT="/var/www/kalpzero-acme"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host)
      HOST="${2:-}"
      shift 2
      ;;
    --web-upstream)
      WEB_UPSTREAM="${2:-}"
      shift 2
      ;;
    --api-upstream)
      API_UPSTREAM="${2:-}"
      shift 2
      ;;
    --email)
      EMAIL="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "${HOST}" || -z "${WEB_UPSTREAM}" || -z "${API_UPSTREAM}" || -z "${EMAIL}" ]]; then
  echo "Usage: $0 --host <host> --web-upstream <host:port> --api-upstream <host:port> --email <email>" >&2
  exit 1
fi

if [[ ! "${HOST}" =~ ^[a-z0-9.-]+$ || "${HOST}" != *.* ]]; then
  echo "Invalid host: ${HOST}" >&2
  exit 1
fi

if [[ ! "${WEB_UPSTREAM}" =~ ^[a-zA-Z0-9._:-]+$ || ! "${API_UPSTREAM}" =~ ^[a-zA-Z0-9._:-]+$ ]]; then
  echo "Invalid upstream target." >&2
  exit 1
fi

SAFE_NAME="$(printf '%s' "${HOST}" | tr '.' '-' | tr -cd 'a-zA-Z0-9-_')"
CONFIG_PATH="/etc/nginx/sites-available/kalpzero-domain-${SAFE_NAME}.conf"
ENABLED_PATH="/etc/nginx/sites-enabled/kalpzero-domain-${SAFE_NAME}.conf"
CERT_PATH="/etc/letsencrypt/live/${HOST}/fullchain.pem"
KEY_PATH="/etc/letsencrypt/live/${HOST}/privkey.pem"

install -d -m 0755 "${ACME_WEBROOT}"

render_http_config() {
  cat > "${CONFIG_PATH}" <<CONFIG
server {
    listen 80;
    server_name ${HOST};

    location /.well-known/acme-challenge/ {
        root ${ACME_WEBROOT};
    }

    location /api/ {
        proxy_pass http://${API_UPSTREAM}/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        proxy_pass http://${WEB_UPSTREAM};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
CONFIG
}

render_https_config() {
  cat > "${CONFIG_PATH}" <<CONFIG
server {
    listen 80;
    server_name ${HOST};

    location /.well-known/acme-challenge/ {
        root ${ACME_WEBROOT};
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name ${HOST};

    ssl_certificate ${CERT_PATH};
    ssl_certificate_key ${KEY_PATH};
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location /api/ {
        proxy_pass http://${API_UPSTREAM}/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        proxy_pass http://${WEB_UPSTREAM};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
CONFIG
}

reload_nginx() {
  nginx -t
  if command -v systemctl >/dev/null 2>&1; then
    systemctl reload nginx
  else
    nginx -s reload
  fi
}

render_http_config
ln -sfn "${CONFIG_PATH}" "${ENABLED_PATH}"
reload_nginx

certbot certonly \
  --webroot \
  --webroot-path "${ACME_WEBROOT}" \
  --non-interactive \
  --agree-tos \
  --keep-until-expiring \
  --email "${EMAIL}" \
  -d "${HOST}"

render_https_config
reload_nginx

printf '{"host":"%s","config_path":"%s","certificate_path":"%s"}\n' "${HOST}" "${CONFIG_PATH}" "${CERT_PATH}"
EOF

chmod 0755 "${PROVISIONER_PATH}"
chown root:root "${PROVISIONER_PATH}"

cat > "${SUDOERS_PATH}" <<EOF
${APP_USER} ALL=(root) NOPASSWD: ${PROVISIONER_PATH}
EOF

chmod 0440 "${SUDOERS_PATH}"
visudo -cf "${SUDOERS_PATH}" >/dev/null

echo "Installed domain automation for ${APP_USER}"
echo "Provisioner: ${PROVISIONER_PATH}"
echo "Sudoers: ${SUDOERS_PATH}"
