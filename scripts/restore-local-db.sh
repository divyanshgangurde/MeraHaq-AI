#!/usr/bin/env bash
# Restore the local MeraHaq corpus DB from scratch on this machine.
#
# The VM's system packages and /var/lib/mysql do NOT survive VM
# replacement, while ~/workspace does. This script rebuilds everything:
# MariaDB install (if absent) -> service start -> db/user -> drizzle
# migrations -> seed all curated chains -> lineage graph dump.
#
# Usage:  bash scripts/restore-local-db.sh
# Requires: .env in the repo root (DATABASE_URL, JWT_SECRET, LLM_API_KEY).
set -euo pipefail
cd "$(dirname "$0")/.."

export DEBIAN_FRONTEND=noninteractive
if ! command -v mariadbd >/dev/null 2>&1; then
  echo "[restore] installing mariadb-server..."
  # Fast path: a previous install leaves the full .deb closure in the apt
  # cache; dpkg can reinstall from it without any network access. (In this
  # VM, apt-get update through the egress proxy can hang for many minutes
  # and a killed update leaves the package lists stranded in partial/,
  # after which apt cannot locate packages at all.)
  if ls /var/cache/apt/archives/mariadb-server_*.deb >/dev/null 2>&1; then
    echo "[restore] reinstalling from cached .debs in /var/cache/apt/archives..."
    dpkg -i /var/cache/apt/archives/*.deb || true
    dpkg -i /var/cache/apt/archives/*.deb || true
    dpkg --configure -a || true
  fi
  if ! command -v mariadbd >/dev/null 2>&1; then
    timeout 120 apt-get -o Acquire::http::Proxy="${http_proxy:-}" -o Acquire::https::Proxy="${https_proxy:-}" update -qq || echo "[restore] apt update incomplete; continuing with existing lists/cache"
    apt-get -o Acquire::http::Proxy="${http_proxy:-}" -o Acquire::https::Proxy="${https_proxy:-}" install -y -qq mariadb-server mariadb-client
  fi
fi

service mariadb start || true
for i in $(seq 1 30); do
  if mysqladmin -u root ping >/dev/null 2>&1; then break; fi
  sleep 1
done

echo "[restore] creating database + user (idempotent)..."
mysql -u root -e "CREATE DATABASE IF NOT EXISTS merahaq; CREATE USER IF NOT EXISTS 'merahaq'@'localhost' IDENTIFIED BY 'merahaq-local'; CREATE USER IF NOT EXISTS 'merahaq'@'127.0.0.1' IDENTIFIED BY 'merahaq-local'; GRANT ALL PRIVILEGES ON merahaq.* TO 'merahaq'@'localhost'; GRANT ALL PRIVILEGES ON merahaq.* TO 'merahaq'@'127.0.0.1'; FLUSH PRIVILEGES;"

set -a && . ./.env && set +a

PNPM="npm exec --yes --package=pnpm@10.4.1 -- pnpm"

echo "[restore] applying drizzle migrations..."
$PNPM exec drizzle-kit migrate

echo "[restore] seeding all verified chains (JJM direct; PM-KISAN + NLM via source cache fallback)..."
$PNPM exec tsx scripts/seed-local.ts

echo "[restore] lineage graph:"
$PNPM exec tsx scripts/graph-dump.ts

echo "[restore] done."
