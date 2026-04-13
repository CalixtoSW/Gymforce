#!/bin/bash
set -euo pipefail

BACKUP_DIR="/opt/gymforce/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=30

mkdir -p "$BACKUP_DIR"

docker exec gymforce-db pg_dump -U "${POSTGRES_USER:-gym}" "${POSTGRES_DB:-gymforce}" | \
    gzip > "$BACKUP_DIR/gymforce_${TIMESTAMP}.sql.gz"

find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$KEEP_DAYS -delete

echo "✅ Backup: gymforce_${TIMESTAMP}.sql.gz"
