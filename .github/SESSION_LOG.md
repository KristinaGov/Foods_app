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
- Hosting decision: GitHub Pages on a private repo needs GitHub Pro;
  alternatives are serving from the Mac over Wi-Fi or a private host
  (e.g. Cloudflare Pages with access control).
- Smoke-test the app (Today date, Grocery list without staples, recipe
  cards) in Safari and reinstall on the iPhone to pick up cache v3.
- Optional: replace the hand-maintained `CATEGORY` map in `categories.js`
  with something generated, so new foods can't silently fall into "Other".
