#!/bin/sh
set -e

echo "→ Pushing Prisma schema to database..."
node node_modules/prisma/build/index.js db push --skip-generate

echo "→ Starting server..."
exec node server.js
