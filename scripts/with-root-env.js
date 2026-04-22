import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT_DIR = resolve(__dirname, '..');
const ENV_FILE = join(ROOT_DIR, '.env');

function loadRootEnv() {
  if (!existsSync(ENV_FILE)) {
    console.error(`Missing ${ENV_FILE}`);
    return;
  }

  const content = readFileSync(ENV_FILE, 'utf8');
  const lines = content.split(/\r?\n/);

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;

    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;

    const key = match[1];
    let value = match[2];

    // Remove quotes if present
    if (value.length >= 2) {
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.substring(1, value.length - 1);
      }
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function setCompatEnv() {
  const env = process.env;
  if (env.KALPZERO_OPENAI_API_KEY && !env.OPENAI_API_KEY) {
    env.OPENAI_API_KEY = env.KALPZERO_OPENAI_API_KEY;
  }
  if (env.KALPZERO_JWT_SECRET && !env.JWT_SECRET) {
    env.JWT_SECRET = env.KALPZERO_JWT_SECRET;
  }
  if (env.KALPZERO_ENCRYPTION_KEY && !env.KALP_SECRET_ENCRYPTION_KEY) {
    env.KALP_SECRET_ENCRYPTION_KEY = env.KALPZERO_ENCRYPTION_KEY;
  }
  if (env.KALPZERO_RUNTIME_MONGO_URL && !env.MONGODB_URI) {
    env.MONGODB_URI = env.KALPZERO_RUNTIME_MONGO_URL;
  }
  if (env.KALPZERO_PUBLIC_WEB_URL && !env.KALP_PUBLIC_BASE_URL) {
    env.KALP_PUBLIC_BASE_URL = env.KALPZERO_PUBLIC_WEB_URL;
  }
  if (env.KALPZERO_PUBLIC_API_URL && !env.NEXT_PUBLIC_KALPZERO_API_URL) {
    env.NEXT_PUBLIC_KALPZERO_API_URL = env.KALPZERO_PUBLIC_API_URL;
  }
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/with-root-env.js <command> [args...]');
  process.exit(1);
}

loadRootEnv();
setCompatEnv();

// Handle the "next" shortcut from with-root-env-next.sh
// The bash script did: exec bash "$SCRIPT_DIR/with-root-env.sh" next "$@"
// So if the first arg is 'next-dev' or similar, we might need to handle it.
// Actually, with-root-env-next.sh was called as: bash ../../scripts/with-root-env-next.sh dev
// which called: bash ../../scripts/with-root-env.sh next dev

const command = args[0];
const commandArgs = args.slice(1);

const isWindows = process.platform === 'win32';
const shell = isWindows ? true : false;

const child = spawn(command, commandArgs, {
  stdio: 'inherit',
  shell: shell,
  env: process.env
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
