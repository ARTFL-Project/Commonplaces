#!/bin/sh
# Start the database, run the application in the foreground, and shut the database down
# cleanly on SIGTERM. Nothing here runs as root.
set -e

# listen_addresses is empty, so the database speaks only over the socket in /tmp - which
# is a tmpfs, and the only writable place on a read-only root filesystem. There is no TCP
# listener at all, which is why all four of web_app.py's psycopg2.connect calls have to
# reach it through PGHOST rather than host="localhost".
pg_ctl -D "$PGDATA" -o "-c unix_socket_directories=/tmp -c listen_addresses=''" -w start

shutdown() {
  kill -TERM "$child" 2>/dev/null || true
  wait "$child" 2>/dev/null || true
  # Without this every restart is a crash recovery. On a 229 GB cluster with a 1.1 GB
  # write-ahead log that is not the two seconds it was on a small database, and the weekly
  # rebuild would pay it every Sunday.
  pg_ctl -D "$PGDATA" -m fast -w stop || true
  exit 0
}
trap shutdown TERM INT

gunicorn -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000 -w 4 \
  --worker-tmp-dir /tmp \
  --access-logfile - --error-logfile - \
  web_app:app &
child=$!

# Nothing else supervises PostgreSQL: two processes share this container and if the
# database dies the application stays up serving errors. If pg_isready fails twice in a
# row, exit and let `restart: unless-stopped` rebuild the container instead.
while kill -0 "$child" 2>/dev/null; do
  sleep 15
  # -U postgres -d postgres matters. Bare pg_isready connects as the OS user, which is
  # uid 482 "commonplaces" - a role that does not exist in this cluster. pg_isready still
  # exits 0, because the server answered and that is all it asks, so the watchdog works
  # either way; but the server logs FATAL: role "commonplaces" does not exist every 15
  # seconds forever. A log full of harmless FATALs is how people learn to ignore real ones.
  pg_isready -q -U postgres -d postgres \
    || { sleep 5; pg_isready -q -U postgres -d postgres || { echo "postgres gone; exiting"; shutdown; }; }
done
wait "$child"
