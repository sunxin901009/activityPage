#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
stamp="${1:?Pass backup timestamp}"
[[ "$stamp" =~ ^[0-9]{8}T[0-9]{6}Z$ ]] || { echo 'Invalid timestamp' >&2; exit 1; }
[[ "${CONFIRM_RESTORE:-}" == 'replace-current-database' ]] || { echo 'Set CONFIRM_RESTORE=replace-current-database; this replaces current content.' >&2; exit 1; }
test -s "deploy/backups/$stamp.dump"
test -s "deploy/backups/$stamp.uploads.tar.gz"
docker compose stop web directus
docker compose up -d database
docker compose run --rm -T restore -c "pg_restore --clean --if-exists --no-owner --exit-on-error -d portfolio /backups/$stamp.dump && tar -xzf /backups/$stamp.uploads.tar.gz -C /uploads"
docker compose up -d directus web
printf 'Restored %s; verify CMS and pages before reopening traffic.\n' "$stamp"
