#!/bin/bash
# Creates required databases on the shared Postgres container.
# Run once before first docker compose up on a fresh VPS.
# The "medusa" database is created automatically by the postgres container
# via POSTGRES_DB — only the additional databases need to be created here.

set -euo pipefail

echo "=== Creating application databases ==="

docker exec suzanne_postgres psql -U medusa -c "CREATE DATABASE IF NOT EXISTS payload;"
docker exec suzanne_postgres psql -U medusa -c "CREATE DATABASE IF NOT EXISTS calcom;"
docker exec suzanne_postgres psql -U medusa -c "CREATE DATABASE IF NOT EXISTS n8n;"

echo "=== Databases created ==="
echo "  ✓ payload"
echo "  ✓ calcom"
echo "  ✓ n8n"
echo ""
echo "Now run: docker compose up -d"
