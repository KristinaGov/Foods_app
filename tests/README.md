# UI tests

Headless-browser checks of the app in `app/`, written with Playwright for
Python. They were the safety net while the app was built; run them after any
change to `app/js`, `app/css` or `app/index.html`.

## Setup (once)

The project `.venv` is Python 3.9 and does not include Playwright. Make a
separate venv for the tests (pip must be upgraded first or Playwright is
"not found" on this Python):

```
python3 -m venv tests/.venv
tests/.venv/bin/python -m pip install --upgrade pip
tests/.venv/bin/pip install playwright
tests/.venv/bin/playwright install chromium
```

## Run

```
tests/ui/run_all.sh
```

Each test prints what it checked and ends with `errors: []` when no console
or page errors occurred. Screenshots land in `tests/ui/_out/` (ignored by git).

The app is served to the browser through request interception, so no HTTP
server is needed. The one exception is `test_service_worker_update.py`, which
exercises a real service worker and needs the app served over HTTP:

```
(cd app && python3 -m http.server 8080 --bind 127.0.0.1) &
tests/.venv/bin/python tests/ui/test_service_worker_update.py
```

It temporarily edits `app/service-worker.js` to simulate a deploy and restores
it afterwards.
