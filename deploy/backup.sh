#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
: "${BACKUP_REMOTE:?Set BACKUP_REMOTE to an off-server rclone destination}"
command -v rclone >/dev/null
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p deploy/backups
docker compose run --rm -T backup -ec "pg_dump -Fc > /backups/$stamp.dump; tar -czf /backups/$stamp.uploads.tar.gz -C /uploads ."
rclone copyto "deploy/backups/$stamp.dump" "$BACKUP_REMOTE/$stamp.dump"
rclone copyto "deploy/backups/$stamp.uploads.tar.gz" "$BACKUP_REMOTE/$stamp.uploads.tar.gz"
printf 'Backup uploaded: %s\n' "$stamp"
