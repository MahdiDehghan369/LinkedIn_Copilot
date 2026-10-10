#!/usr/bin/env bash
# Starts the local development datastores:
#   - FerretDB (MongoDB wire-protocol compatible server, SQLite-backed)
#     standing in for `mongod` on port 27017.
#   - Redis on port 6379.
#
# Why FerretDB instead of a real `mongod`: this sandbox's outbound network
# is restricted to an allowlist of domains that does not include
# fastdl.mongodb.org (where `mongod` and `mongodb-memory-server` fetch
# their binaries from), and Ubuntu's own apt repositories no longer carry
# `mongodb-org` packages. FerretDB is a real, actively-maintained server
# that speaks the actual MongoDB wire protocol — Mongoose talks to it
# exactly as it would talk to `mongod` — and its release binaries are
# hosted on GitHub, which is reachable here. In a normal environment with
# unrestricted network access, point MONGODB_URI at a real `mongod` /
# MongoDB Atlas instance instead; nothing in the application code is
# FerretDB-specific.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="$ROOT_DIR/backend/.local-data/ferretdb"
LOG_FILE="$ROOT_DIR/backend/logs/ferretdb.log"
FERRETDB_BIN="$ROOT_DIR/tools/ferretdb"

mkdir -p "$DATA_DIR" "$(dirname "$LOG_FILE")"

if ! pgrep -f "$FERRETDB_BIN" > /dev/null 2>&1; then
  echo "Starting FerretDB (MongoDB-compatible) on 127.0.0.1:27017 ..."
  setsid nohup "$FERRETDB_BIN" \
    --listen-addr=127.0.0.1:27017 \
    --handler=sqlite \
    --sqlite-url="file:$DATA_DIR/" \
    --log-level=warn \
    > "$LOG_FILE" 2>&1 < /dev/null &
  sleep 2
  disown -a 2>/dev/null || true
else
  echo "FerretDB already running."
fi

if ! redis-cli ping > /dev/null 2>&1; then
  echo "Starting Redis on 127.0.0.1:6379 ..."
  redis-server --daemonize yes --port 6379 --logfile "$ROOT_DIR/backend/logs/redis.log"
  sleep 1
else
  echo "Redis already running."
fi

echo "Datastores ready."
