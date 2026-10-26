#!/bin/sh
set -e

# Ensure data directory exists
mkdir -p /app/data

# Sync database schema if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
  echo "Applying database schema migrations..."
  node ./node_modules/prisma/build/index.js db push --skip-generate
fi

echo "Starting Next.js standalone server..."
exec node server.js
