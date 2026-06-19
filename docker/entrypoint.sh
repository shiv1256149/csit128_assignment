#!/bin/sh
set -e

echo "Running migrations..."
npx knex migrate:latest

echo "Checking whether seed data is needed..."
node docker/seed-if-empty.js

echo "Starting server..."
exec node server.js
