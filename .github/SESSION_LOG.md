# Session Log — Foods_app

Append-only, chronological record so any agent (on any machine, or any
tunneled/other device opening a new chat) can pick up where a previous chat
left off. Read **"Key Design Decisions" and the last dated entry** before
starting work. When you finish a session or complete a meaningful chunk of
work, add a new entry below the last one — do not edit or remove earlier
entries. If a session settles a product/design decision (not just a code
change), add it to "Key Design Decisions" too, so it doesn't get buried.

---

## Key Design Decisions
Running list of decisions about what the project *is*, not just what's been
coded. Append new decisions at the bottom; never delete — if a decision is
later reversed, add a new bullet noting the change and why.

- **Product goal:** an app to help plan and track a baby's solid-food
  introduction, based on the "Solid Starts First 100 Days" plan in
  `materials/`. Target device: the user's iPhone.
- **Required functionality (as requested by the user):**
  - Food tracker — record which foods have been tried.
  - Weekly plan for grocery purchases for the upcoming week.
  - Daily summary of what to cook for the baby.
  - Daily notes on the baby's reaction to foods.
- **Platform choice:** implemented as a installable web app (PWA) — plain
  HTML/CSS/JS under `app/`, with a service worker for offline support,
  installed on iPhone via Safari → Share → "Add to Home Screen" (no native
  iOS app / App Store build).
- **App structure (5 views):** Today (day N of the 100-day plan, computed
  from a stored baby "Day 1" date; what to cook, family meal, new foods to
  introduce with tap-to-mark-tried, allergens, daily reaction/notes entry),
  Tracker (searchable list of all foods from the plan + custom additions,
  tried/not-tried, reaction, per-food notes), Grocery (checklist of new
  ingredients for the next 7 days, grouped by category — Produce, Protein,
  Dairy, Grains & Pantry, Nuts & Seeds — navigable week by week), Notes
  (chronological history of daily reaction notes), Settings (set baby's
  Day 1 date, prompted on first launch; export/import tracked data as JSON
  for backup or manual commit to GitHub).
- **Data source:** `app/data/plan.json`, derived from `materials/parsed_plan.json`
  (the parsed 100-day Solid Starts plan).
- **Known limitation (unresolved):** the Grocery view is built only from
  each day's "new foods introduced," not full recipe ingredient lists with
  quantities — the source plan JSON doesn't have structured ingredient
  data. Full recipe text (ingredients/steps/"How to Serve") exists in the
  raw `materials/Solid-Starts-First-100-Days-1.txt`/`.pdf` but parsing it
  into a usable `recipes.json` is not finished (a `materials/extract_recipes.py`
  attempt existed at one point but is not present in the current workspace —
  needs to be reconciled/redone).
- **Pending decision, not yet actioned:** setting up a git repo + GitHub
  Pages hosting was proposed as a next step. This requires explicit user
  confirmation before pushing anything to a remote.
- **Working style requested by the user (applies project-wide, see
  `copilot-instructions.md`):** explain what you're about to do before each
  step, and only ask for permission when changing or writing files.
- **Recipe data (2026-10-22, supersedes the "Known limitation" bullet
  above):** full recipes (ingredients, steps, how to serve/store, yield,
  cook time) ARE now extracted for all 100 days / 164 recipes and shipped in
  `app/data/plan.json`; the Today view shows them as expandable cards.
- **Canonical data pipeline (2026-10-22, consolidated 2026-10-23):**
  `materials/extract_recipes.py` (PDF → `recipes_raw.json`, via pdfplumber
  word coordinates) then `materials/merge_recipes.py` (→
  `materials/parsed_plan.json` AND `app/data/plan.json`). The older
  `parse_plan.py` / `parse_plan2.py` text parsers were deleted. JSON outputs
  are never edited by hand; fix the script and rerun.
- **Python environment (2026-10-23):** the project `.venv` (Python 3.9,
  Intel macOS) with `requirements.txt` (pdfplumber 0.11.5, cryptography<46
  because newer versions have no prebuilt Intel-mac wheel). The Anaconda
  base env that was used on 2026-10-22 is no longer needed.
- **Grocery list scope (user decision 2026-10-23):** the weekly checklist
  lists only the plan's *new foods* for the week, minus pantry staples
  (spices, oils, vinegar, vanilla extract — `PANTRY_STAPLES` in
  `app/js/categories.js`). Full recipe ingredient lists are deliberately NOT
  put on the grocery list; they are visible per recipe on the Today tab.
- **Version control / hosting (user decision 2026-10-23):** git repo
  initialised locally; GitHub repo must be **private** (personal use only).
  The Solid Starts PDF and its `.txt` dump are copyrighted and are
  git-ignored — they must never be committed. Hosting choice still open:
  GitHub Pages for a private repo requires GitHub Pro (see 2026-10-23 entry).
- **Repo made PUBLIC + GitHub Pages (user decision 2026-10-23, reverses
  the "private" bullet above):** Pages on a private repo needs GitHub Pro,
  so the user chose a public repo. App URL:
  https://kristinagov.github.io/Foods_app/ — deployed from `app/` only by
  `.github/workflows/pages.yml` on every push to `main` (`materials/` is not
  served). Discoverability is minimised where GitHub allows: repo has no
  description/topics/README, and `app/index.html` carries
  `<meta name="robots" content="noindex, nofollow, noarchive">`. A
  `robots.txt` would NOT help (project sites can't set one at the domain
  root). The repo page itself on github.com can still be indexed — the only
  further mitigation would be an unrelated repo name. Caveat the user
  accepted: `plan.json`/`recipes_raw.json` with the full recipe text are
  now public even though the PDF/.txt are not.
- **User data persistence (user decision 2026-10-25):** tracked data stays
  in localStorage on the phone (survives app updates; lost on icon
  deletion / Safari data clear / new phone). Two backup paths, both
  explained in Settings: (1) manual Export/Import JSON file, with a
  reminder card on Today after 14 days without a backup; (2) optional
  automatic backup to a **secret Gist** in the user's GitHub account
  (`app/js/sync.js`), using a classic personal access token with only the
  `gist` scope, pasted once in Settings and stored in its own localStorage
  key (never in export files). Every change is uploaded after a 2.5 s
  debounce; on launch/foreground the newest copy (by `updatedAt`) wins, so
  two devices can share one backup. The data is NOT stored in the public
  app repo.

---

## 2026-10-20 (reconstructed) — original app-build chat
This entry reconstructs an earlier chat (same day, ~13:09–19:22) that was not
logged at the time, recovered from session history so its decisions aren't
lost. See "Key Design Decisions" above for the lasting outcomes.

**Done:**
- Took the user's feature request (tracker, weekly grocery plan, daily
  cook summary, daily reaction notes) and built a working PWA under `app/`:
  `index.html`, `css/styles.css`, `js/{app,categories,store,views}.js`,
  `manifest.webmanifest`, `service-worker.js`.
- Created `materials/parse_plan.py`, `materials/parse_plan2.py`, and
  `materials/extract_recipes.py` while deriving `plan.json` from the source
  text/PDF.
- Served the app locally (`http://localhost:8000` / LAN IP for iPhone
  testing) and confirmed assets load (200 OK).

**Current state at end of that chat:**
- All 5 views (Today/Tracker/Grocery/Notes/Settings) implemented and
  verified to serve correctly; not yet confirmed working end-to-end on an
  actual iPhone by the user.
- Grocery list limited to "new foods" only (see known limitation above).
- No git repo / GitHub Pages set up yet (proposed, awaiting confirmation).

**Open questions / next steps (as of that chat):**
- Try the app on the iPhone and report back.
- Decide whether to invest in full recipe/ingredient extraction for a more
  complete grocery list.
- Decide whether to set up GitHub sync + Pages hosting.

---

## 2026-10-20
**Done:**
- Created `.github/copilot-instructions.md` with core working rules: explain
  before doing, use approved/verified methods over improvisation, avoid
  duplicate files, ask before assuming on unclear goals/design, and maintain
  this session log.
- Observed (not authored in this chat) a scaffold under `app/`: `index.html`,
  `manifest.webmanifest`, `service-worker.js`, `css/`, `js/` (`app.js`,
  `categories.js`, `store.js`, `views.js`), `data/plan.json` (copy of
  `materials/parsed_plan.json`), and generated `icons/` PNGs — suggests a
  plain JS/PWA direction, unconfirmed with the user.
- Explored `materials/Solid-Starts-First-100-Days-1.pdf` directly with
  `pdfplumber` (word/line extraction per page), likely to improve on the
  text-based parsing in `materials/parse_plan.py` / `parse_plan2.py`.

**Current state:**
- `materials/parse_plan.py` and `materials/parse_plan2.py` still both exist —
  unresolved duplication (see "Current known cleanup item" in
  `copilot-instructions.md`).
- `materials/parsed_plan.json` is the only tracked parser output; `app/data/plan.json`
  is a manual copy of it (not generated by a script yet).
- `app/` has a working-looking scaffold but it has not been verified
  (not run/tested in this chat).
- No package manifest, build tooling, or tests exist yet.

**Open questions / next steps:**
- Confirm the intended tech stack for `app/` (plain JS PWA vs. a framework)
  and overall project goal/scope with the user.
- Decide which `materials/parse_plan*.py` script is canonical (or merge),
  delete the other, and wire `app/data/plan.json` to be generated from it
  rather than manually copied.
- Verify `app/index.html` + `app/js/*` actually load and render `plan.json`.

---

## 2026-10-22 (reconstructed) — recipe extraction finished
Not logged at the time; reconstructed on 2026-10-23 from file timestamps
(~00:08–00:22) and the code itself. The user confirmed it was their work in
progress.

**Done:**
- Replaced the text-based `parse_plan.py` / `parse_plan2.py` with
  `materials/extract_recipes.py`, which reads the PDF with pdfplumber and
  splits each page into header/ingredients/steps/serving columns by word
  x-coordinates. This fixed wrapped multi-line cells (e.g. Day 50 allergens
  now include Peanut and Sesame).
- Added `materials/merge_recipes.py` to fold `recipes_raw.json` into the
  per-day plan structure. Its output was renamed by hand to
  `materials/parsed_plan.json` and copied by hand to `app/data/plan.json`.
- `app/js/views.js`: Today view renders a recipe card per meal (yield, cook
  time, ingredients, numbered steps, how to serve/store) behind a
  "Show recipe" toggle.

**State at end of session:** all 100 days / 164 recipes present with
title, ingredients, instructions and how-to-serve. One parser leak (Day 36
new food "Whisk the peanut"). Scripts were run with the Anaconda base
Python, not the project `.venv`.

---

## 2026-10-23 — consolidation, bug fixes, git
**Done:**
- Read the log/instructions, audited the whole project, reported findings
  to the user and got decisions (recorded in Key Design Decisions).
- `.venv` made usable: pip upgraded, `pdfplumber==0.11.5` + `cryptography<46`
  installed, `requirements.txt` added.
- `extract_recipes.py`: records the week label from each page header;
  continuation lines for new foods/allergens must now be Title Case (fixes
  the Day 36 "Whisk the peanut" leak).
- `merge_recipes.py`: no longer reads week from its own output; writes
  `materials/parsed_plan.json` and copies it to `app/data/plan.json`.
  Warns on conflicting week labels (source typo: Day 98's second page says
  "Week 15"; Week 14 is used).
- Full pipeline rerun from the PDF (~4 min). Diff against the previous
  `plan.json`: only Day 36's newFoods changed. Verified.
- `app/js/store.js`: `isoDateForDay` formatted in local time instead of
  UTC (in timezones ahead of UTC it returned the previous day, so the Today
  view date and daily-note keys were off by one).
- `app/js/categories.js`: added Goat Cheese, Green Bean, Sapodilla;
  added `PANTRY_STAPLES` + `isPantryStaple()`.
- `app/js/views.js`: Grocery view skips pantry staples; hint text updated.
- `app/service-worker.js`: cache bumped to `baby-food-plan-v3`.
- `.github/copilot-instructions.md`: "Project state" and cleanup sections
  rewritten to match reality.
- `git init` on `main`, `.gitignore` excludes the PDF/.txt, `.venv`,
  `.DS_Store`. GitHub CLI could not be installed via Homebrew (Intel Mac no
  longer supported); a standalone `gh` binary was downloaded to the session
  scratchpad and a device-flow login was started for the user.

**Current state:**
- App code and data are consistent; the pipeline is reproducible from the
  `.venv`. The JS changes have NOT yet been loaded in a browser or on the
  iPhone (no Node/browser available in the agent session) — needs a manual
  smoke test.

**Open questions / next steps:**
- ~~User to complete GitHub device login; then create the private repo and
  push.~~ Done later the same day: private repo
  https://github.com/KristinaGov/Foods_app created with `gh`, `main` pushed.
  `gh` itself is not installed system-wide (Homebrew no longer supports this
  Intel Mac); the standalone binary lives only in a temp folder, so future
  sessions need to re-download it from https://github.com/cli/cli/releases
  or use plain `git push` (credentials are stored for https).
- ~~Hosting decision~~ Settled later the same day: repo switched to public,
  Pages enabled (workflow build type), first deploy verified — all app
  assets return 200 at https://kristinagov.github.io/Foods_app/ and
  `materials/` returns 404. See Key Design Decisions.
- To install on the iPhone: open the URL above in Safari → Share → "Add to
  Home Screen". Each push to `main` redeploys automatically; the service
  worker cache name must still be bumped for data/JS changes.
- Smoke-test the app (Today date, Grocery list without staples, recipe
  cards) in Safari and reinstall on the iPhone to pick up cache v3.
- Optional: replace the hand-maintained `CATEGORY` map in `categories.js`
  with something generated, so new foods can't silently fall into "Other".

---

## 2026-10-25 — data backup & sync
**Done:**
- `app/js/sync.js` (new): GitHub secret-Gist backup — connect (validate
  token, find gist by file name `baby-food-plan.json` or create it), push
  (PATCH), pull, disconnect, debounced auto-push, newest-wins reconcile on
  start/foreground.
- `app/js/store.js`: `updatedAt` on every save, `onChange()` listeners,
  `hasUserData()`, stricter `importJSON()` validation that keeps the
  backup's own `updatedAt`.
- `app/index.html` + `app/js/app.js`: Settings rewritten with a "Your data"
  explanation and two sections (backup file / GitHub), connect/back up
  now/restore/disconnect flows, conflict prompt when both phone and GitHub
  hold data, `navigator.storage.persist()` request at launch.
- `app/js/views.js`: amber reminder card on Today when data exists but no
  export in 14 days and GitHub is not connected.
- `app/service-worker.js`: cache v4, `sync.js` precached, cross-origin
  requests (GitHub API) are never cached.
- Verified: all JS passes a JavaScriptCore syntax check; the exact Gist API
  sequence (list → create secret → PATCH → GET → DELETE) was exercised with
  the user's gist-scoped token via `gh api` and a temporary gist (deleted).
  Not verified: the UI itself in a browser (no browser in the agent
  session).

**Open questions / next steps:**
- User to create a classic token with only `gist` scope and connect it in
  Settings on the phone; confirm the reminder card and restore flow look
  right.
- Possible follow-up: show a small sync indicator outside Settings.

---

## 2026-10-26 — saved-note feedback & weekly overview tab
**Done:**
- `app/js/views.js` (Today): a note is now shown as read-only text with a
  "✓ Saved" badge and an Edit button once saved; the textarea only appears
  while nothing is saved yet or after tapping Edit (Save / Cancel). Saving
  an empty box clears the note. State: `viewState.editingNotesFor`.
- New "Weeks" tab (`📖`, between Grocery and Notes): `renderWeeks()` shows
  one week at a time with ‹ › navigation, defaulting to the current week.
  Each page has a hand-written summary of that week's intro pages from the
  PDF (`app/data/weeks.json`, 15 entries; weeks 14+15 share one PDF
  chapter), plus "This week at a glance": allergens appearing for the first
  time, new foods, family meals, and a day-by-day meal list with dates.
- `app/js/store.js`: `loadWeeks()`; `app/js/app.js` loads plan and weeks in
  parallel and registers the tab; `app/service-worker.js`: cache v5,
  `weeks.json` precached; `app/css/styles.css`: saved-note, note-actions,
  week-tip, week-day-row styles.
- Verified in headless Chromium (Playwright, files served via request
  interception since the sandbox blocks local sockets): save → text +
  badge, survives reload, Edit/Cancel/re-save, other days keep their own
  textarea, Weeks nav clamps at 1 and 15, no console errors.

**Open questions / next steps:**
- `plan.json` Day 19 has `familyMeal: "Antipasto Salad Artichoke"` — the
  parser glued the new food "Artichoke" onto the meal name. Fix in
  `materials/merge_recipes.py` / `extract_recipes.py` rather than by hand.
- Tracker food notes still save silently on blur; could get the same
  saved-text treatment if it feels unclear there too.

---

## 2026-10-26 (later) — tracker notes, back-to-today, colour schemes
**Done:**
- Tracker: food notes use the same saved-text / Edit / Cancel pattern as
  Today's notes (`foodNotesHTML()`, `viewState.editingFoodNote`); the old
  silent save-on-blur is gone.
- Today: "↩ Back to today" button under the date whenever the day nav is
  away from today (`viewState.todayDayOffset !== 0`).
- Colour schemes: `app/js/theme.js` (new) with four schemes — Light
  (unchanged), Plum (purple), Ocean (blue), Orchid (magenta) — picked via
  swatches at the top of Settings. Preference stored in localStorage
  `babyFoodPlan.theme` (device setting, not part of the backup), applied as
  `data-theme` on `<html>` by an inline script in `index.html` before CSS
  paints, and mirrored into `<meta name="theme-color">`. `styles.css` now
  uses only tokens (`--accent`, `--accent-strong`, `--on-accent`, `--bg`,
  `--card`, `--soft`, `--text`, `--muted`, `--border`, `--danger`,
  `--warn`, `--notice-bg`, `--overlay`) plus `color-scheme` so native
  inputs go dark too.
- Service worker cache v6, `theme.js` precached.
- Verified in headless Chromium: tracker note save/reload/edit/cancel,
  back-to-today appears and resets the offset, each theme applies, persists
  across reload and updates the meta colour; screenshots of all four
  schemes checked by eye.

---

## 2026-10-26 (evening) — tracker icons and per-try history
**Done:**
- `categories.js`: `ICON` map (every plan food + common custom foods) and
  `iconFor()` — exact match, then longest-keyword match ("Baked Sweet
  Potato Mash" → 🍠), then the category's icon. Shown at the left of each
  Tracker row (`.food-icon`).
- Try history: `foodTracker[food].tries = [{ date, reaction }]`.
  `firstDate`, `reaction` (= latest try) and `timesServed` are now derived
  by `recompute()`; `migrate()` on load and import turns old entries into a
  single try. New store methods `addTry`, `updateTry`, `removeTry`,
  `tryIndexOn`; `markFood` keeps working for notes/legacy callers.
- Tracker row: tries listed newest first, each with a native date input, a
  reaction `<select>` and ✕; "+ Add another try" adds today's date. Removing
  the only try (or unmarking a food with several tries) asks to confirm.
  Meta line: "First tried … • N tries • last: …". Per-food note unchanged.
- Today tab: a food pill now logs/removes a try for the day being viewed
  (✓ = tried that day, ↻ = tried on an earlier day), so browsing back to an
  earlier day and tapping records the right date.
- Service worker cache v7.
- Verified in headless Chromium: migration of a legacy entry, Today pills
  on day 1, add/edit reaction/edit date (re-sorts, firstDate follows)/remove,
  food returns to not-tried after last try, chip mark, filter counts.

---

## 2026-10-26 (night) — grocery list from the PDF ingredient tables
**Problem:** the Grocery tab only listed each week's *new* foods, so anything
introduced earlier and used again (e.g. broccoli on Day 26) never appeared,
and it had no quantities or substitutes.

**Done:**
- `materials/extract_groceries.py` (new, pdfplumber): parses every
  "Week N: Ingredient List" page into `app/data/groceries.json` keyed by
  plan week. Column boundaries come from the "Quantity"/"Notes" header
  words on each page; wrapped rows are merged by vertical proximity.
  Sections kept in PDF order (Dairy, Meat, or Fish / Pantry / Produce /
  Check for Leftovers); each item has `item`, `qty`, `note`. Weeks 14 and
  15 share one list ("14+15" in the PDF) and get identical entries.
  Checked: 0 items without a quantity; week 4 has 26 items incl. Broccoli.
- Grocery tab rewritten: shows plan weeks (‹ › like the Weeks tab, weeks
  14 + 15 as one page), items with quantity on the right and the PDF note
  underneath; notes containing "substitute" are highlighted with ⇄ as the
  available alternative. Progress count, "Uncheck all". Checkmarks are
  keyed `week-N` / `week-14+15` (old keys by week-start date are orphaned,
  harmless).
- `categories.js` CATEGORY / PANTRY_STAPLES are no longer used by the
  Grocery tab (only `iconFor` is imported now); left in place.
- Service worker cache v8, `groceries.json` precached.
- Verified in headless Chromium: week 4 shows all 26 items incl. Broccoli
  with 7 alternative notes, checks persist per week and across reload, nav
  clamps at 1 and 14, no console errors.

---

## 2026-10-26 (late) — activity grid on the Tracker
**Done:**
- GitHub-style grid card at the top of the Tracker (`renderActivityGrid()`
  in views.js): one tile per food in plan-introduction order (custom foods
  last). Untried = border colour; tried = accent at 45% / 72% / 100% for
  1 / 2 / 3+ tries; latest reaction "rash" = danger colour. Heading
  "N of M foods tried", legend, tapping a tile searches for that food.
- Sizing: measured at render time from the grid's width and `#view`
  height; the largest tile size (22px down to 4px, gap ≈ 22% of tile) is
  chosen such that all rows fit in `viewHeight / 3 − 84px` of card
  overhead. Re-laid out on resize/rotation (debounced).
  Measured share of the content area: iPhone 13 0.29 (16 cols × 16px),
  SE 0.26 (20 × 12px), 15 Pro Max 0.29 (16 × 19px), landscape 0.27
  (60 × 11px).
- Service worker cache v9.

---

## 2026-10-26 (night) — app updates not reaching the phone
**Problem:** after pushing v9 the phone kept showing the old version even
after two launches. GitHub Pages serves every file, including
`service-worker.js`, with `cache-control: max-age=600`, and the browser's
service-worker update check honours that HTTP cache for up to 24 h unless
told otherwise. So a check within ~10 minutes of a deploy sees the old
worker and nothing changes. The deploy itself was fine (live site served
v9 and rendered the grid in a fresh browser).

**Done:**
- `app.js`: register with `{ updateViaCache: "none" }` (always re-fetch
  the worker script); `reg.update()` whenever the app returns to the
  foreground; on `controllerchange` reload the page once so the new files
  run on the first launch instead of the second (skipped on first-ever
  install). Settings gains an "App version" line (asks the controlling
  worker for its cache name over a MessageChannel) and a "Check for
  updates" button.
- `service-worker.js`: cache v10, `message` handler answering `version`.
- Verified against the local server with a real service worker: v10 shown;
  bumping the cache name on disk and tapping Check for updates installed
  the new worker, auto-reloaded, showed v11, old cache deleted.

**Note for the phone:** the currently installed old worker lacks all of
this, so one more manual cycle is needed: wait >10 min after the deploy,
force-quit and reopen the app twice. From v10 on, updates self-apply.

---

## 2026-10-26 (late night) — clearing the tile filter
**Problem:** tapping an activity tile filled the search box with that food
and the only way back to the full list was to empty the search field.

**Done:** tapping the selected tile again clears the filter; the selected
tile gets an outline ring; a "✕ Show all" button appears next to the search
box whenever any filter text is set (tile tap or typed). Cache v11.

---

## 2026-10-26 (late night) — worker v11 serving older files
**Problem:** the phone reported v11 but lacked v11's UI. The worker's
`cache.addAll()` at install fetches through the browser HTTP cache, and
GitHub Pages marks every file `max-age=600`, so a freshly installed worker
can cache JS/CSS that are up to 10 minutes stale.

**Done:**
- `service-worker.js`: install requests use `cache: "reload"` so the new
  cache is always filled from the network. Cache v12.
- `app.js`: `APP_VERSION` constant (bump together with `CACHE_NAME` on
  every deploy). Settings shows just the version when worker and files
  agree, and a red "v13, but the app files are v12 — tap Check for
  updates" line when they don't.
- Verified with a real worker on the local server: v12 shown; bumping only
  the worker produced the mismatch warning after the auto-reload.

**Deploy checklist from now on:** bump `CACHE_NAME` in service-worker.js
AND `APP_VERSION` in app.js, commit, push.

---

## 2026-10-27 — tracker grouped by category
**Done:**
- `categories.js`: CATEGORY map reworked into tracker-oriented groups —
  Vegetables, Fruit, Meat, Fish & Eggs, Beans & Soy, Dairy, Grains & Bread,
  Nuts & Seeds, Herbs & Spices, Pantry & Condiments (+ Other fallback);
  `CATEGORY_ICON` per group; `categoryFor()` now does longest-keyword
  matching for custom foods ("Baked Sweet Potato Mash" → Vegetables).
  All 138 plan foods map to a group (checked, none fall to Other).
- Tracker: the list is split into one card per category with "N/M tried"
  in the header; a horizontally scrolling chip row (All + each category
  with tried/total) filters to one category, combinable with the
  tried / not-tried buttons, the search box and tile taps. Tapping the
  active chip again clears it.
- Cache v13 / APP_VERSION v13.

---

## 2026-10-27 — allergen marking in the Tracker
**Done:**
- `categories.js`: `ALLERGEN` map food → group (Egg, Peanut, Dairy, Wheat,
  Sesame, Soy, Coconut, Finned Fish, Tree Nut), `ALLERGEN_ORDER`,
  `allergenFor()` with keyword matching for custom foods. 38 of the 138
  plan foods are allergens.
- Tracker: red "⚠ Egg"-style badge after the name of every allergen food;
  an "⚠ Allergens" chip (with tried/total) in the chip row that limits the
  list to allergen foods and regroups it by allergen type instead of food
  category. Combines with tried / not-tried, search and tile taps.
- Cache v14 / APP_VERSION v14.

---

## 2026-10-27 — tab order
Tab bar reordered to Week · Today · Tracker · Grocery · Notes (the Weeks
tab label shortened to "Week"). App still opens on Today. Cache v15.

---

## 2026-10-27 — allergens as a sub-group, not a regrouping
Per user: allergens must cut across the nine major categories rather than
replace them. Each category card now lists its allergen foods first under a
red "⚠ Allergens" sub-heading, then "Other foods" (sub-headings only when
the card has both kinds; Dairy is all allergens). The Allergens chip keeps
the category grouping and hides non-allergen foods. `ALLERGEN_ORDER` is no
longer used by the view. Cache v16.

---

## 2026-10-27 — improvement round (bugs, plan-driven features, housekeeping)
**Bugs fixed:**
- Tracker search lost focus after one character (every keystroke rebuilt
  the whole tab). The list now lives in `#tracker-results` and typing
  refreshes only that part (`refreshTrackerResults()`); the "Show all"
  button is always in the DOM and toggled with `.hidden`.
- Today re-render folded open recipes. Open `<details>` indexes are kept in
  `viewState.openRecipes` and restored after each render of the same day.

**Features:**
- Today → "🔁 Also in today's recipes": tracker foods detected in the day's
  ingredient lines (`foodsInIngredients()` in categories.js, longest match
  first with `FOOD_ALIASES` for spellings like oatmeal/tahini/eggs), minus
  the day's new foods, allergens first. Same one-tap try logging as the new
  food pills. Heuristic: unusual spellings may be missed.
- Today → "🔁 Allergen check": for every allergen group with at least one
  try, days since last served as of the viewed day; ≥7 days is flagged
  "serve again" (plan: repeat each allergen at least twice a week).
- Notes tab → "Timeline": one dated log of daily reactions/notes, every
  food try (with reaction, "first try" tag, allergen badge) and food notes
  (shown under the food's latest try). Filters: Everything / Reactions /
  Notes.
- Custom foods: "Add a food" now adds to `state.customFoods` as not tried
  (no fake try date); untried custom foods have a ✕ to remove them; adding
  an existing name just searches for it.

**Housekeeping:**
- `views.js` split into `views/shared.js` (state, helpers) and one module
  per tab (`today`, `tracker`, `grocery`, `weeks`, `notes`); `views.js` is
  now a barrel so app.js is unchanged. All new files precached.
- Browser tests moved into the repo: `tests/ui/*.py` with `_helper.py`
  (request-interception serving), `run_all.sh`, `tests/README.md` (venv
  setup; Playwright needs a pip upgrade on this Python 3.9). The service
  worker test is version-agnostic now and needs a real HTTP server.
- Day 19 title "Antipasto Salad Artichoke" → "Antipasto Salad" in
  plan.json/parsed_plan.json, with `TITLE_FIXES` in merge_recipes.py so a
  regeneration keeps it.
- Old grocery tick keys (week-start dates) are dropped on load and written
  back without touching `updatedAt`.
- Cache v18 / APP_VERSION v18. All 11 tests pass.
