#!/bin/sh
# Runs every UI test. Needs the playwright venv described in tests/README.md:
#   tests/ui/run_all.sh                 (uses tests/.venv/bin/python by default)
#   PYTHON=/path/to/python tests/ui/run_all.sh
set -e
cd "$(dirname "$0")"
mkdir -p _out
PY="${PYTHON:-../.venv/bin/python}"
status=0
for t in test_*.py; do
  case "$t" in test_service_worker_update.py) continue;; esac   # needs a real HTTP server, see README
  echo "== $t"
  if ! "$PY" "$t"; then status=1; fi
done
exit $status
