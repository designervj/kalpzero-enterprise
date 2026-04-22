#!/usr/bin/env bash
set -e

echo "======================================================"
echo "    KalpZero Enterprise Auto-Setup & Run Script     "
echo "======================================================"
echo "This script checks for missing dependencies, installs"
echo "them if absent (and skips if already present), and"
echo "starts the project automatically."
echo "======================================================"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# 1. System Dependencies (Node, Python3, Git, curl, Postgres, Redis, MongoDB)
echo ""
echo "-> Checking system dependencies..."

MISSING_PACKAGES=""

if ! command -v node &> /dev/null; then MISSING_PACKAGES="$MISSING_PACKAGES nodejs"; fi
if ! command -v npm &> /dev/null; then MISSING_PACKAGES="$MISSING_PACKAGES npm"; fi
if ! command -v python3 &> /dev/null; then MISSING_PACKAGES="$MISSING_PACKAGES python3 python3-pip python3-venv"; fi
if ! id postgres &> /dev/null; then MISSING_PACKAGES="$MISSING_PACKAGES postgresql postgresql-contrib"; fi
if ! command -v redis-server &> /dev/null; then MISSING_PACKAGES="$MISSING_PACKAGES redis-server"; fi

if [ -n "$MISSING_PACKAGES" ]; then
    echo "Missing system packages detected:"$MISSING_PACKAGES
    echo "Installing missing dependencies via apt (requires sudo)..."
    sudo apt-get update || echo "Warning: apt-get update encountered some issues, continuing anyway..."
    sudo apt-get install -y $MISSING_PACKAGES
else
    echo " [OK] Basic system dependencies (node, python3, psql, redis) are installed."
fi

# 2. MongoDB Check (Ubuntu needs specific steps for MongoDB 8.0/7.0 as it's not in default apt repos)
if ! command -v mongosh &> /dev/null; then
    echo "mongosh (MongoDB) is missing. Attempting to install MongoDB..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get install -y gnupg curl
        curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
           sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor || true
        echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
        sudo apt-get update || echo "Warning: apt-get update encountered some issues, continuing anyway..."
        sudo apt-get install -y mongodb-org
        sudo systemctl start mongod || true
        sudo systemctl enable mongod || true
    fi
else
    echo " [OK] MongoDB is installed."
fi

# 3. PNPM Check
if ! command -v pnpm &> /dev/null; then
    echo "pnpm is missing. Installing pnpm globally..."
    npm install -g pnpm || sudo npm install -g pnpm
else
    echo " [OK] pnpm is installed."
fi

# 4. Database Initialization (Postgres)
if id postgres &> /dev/null; then
    sudo systemctl start postgresql || true
    # Create the current user as a postgres superuser so peer authentication works natively
    sudo -u postgres createuser -s $(whoami) 2>/dev/null || true
    
    # Check if kalpzero_enterprise DB exists
    if ! psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw kalpzero_enterprise; then
        echo "Creating 'kalpzero_enterprise' Postgres database..."
        createdb kalpzero_enterprise 2>/dev/null || echo "Please ensure PostgreSQL service is running."
    else
        echo " [OK] 'kalpzero_enterprise' Postgres database already exists."
    fi
fi

# 5. Environment File setup
if [ ! -f ".env" ]; then
    echo "Missing $ROOT_DIR/.env. Create the repo-root .env before starting the stack."
    exit 1
else
    echo " [OK] Root environment file found at $ROOT_DIR/.env."
fi

# Workspace internal dependencies
echo ""
echo "-> Checking workspace Node and Python layers..."

# Export explicit ports for the backend and frontend
export KALPZERO_API_PORT=8012
export KALPZERO_SUPER_ADMIN_PORT=3002

# Start everything
echo ""
echo "-> Starting KalpZero Services on API:8012 and WEB:3002..."
pnpm super-admin:start
