# Instructions for AI Agents — Foods_app

## Project state
A working, installable web app (PWA) lives under `app/` (plain HTML/CSS/JS,
no framework, no build step, no package manifest). Its data file
`app/data/plan.json` is generated from the "Solid Starts First 100 Days" PDF
by the two-step pipeline in `materials/`:

    .venv/bin/python materials/extract_recipes.py   # PDF -> materials/recipes_raw.json
    .venv/bin/python materials/merge_recipes.py     # -> materials/parsed_plan.json + app/data/plan.json

Never edit the JSON outputs by hand; fix the scripts and rerun. The project
`.venv` (Python 3.9, Intel macOS) has the pinned dependencies from
`requirements.txt`. The source PDF and its `.txt` dump are copyrighted and
git-ignored — they exist only on the user's machines, not in the repo.

The authoritative, up-to-date description of what exists and what is open is
`.github/SESSION_LOG.md`; this section is only a quick orientation. Treat any
assumption beyond what is in the repo as unverified — confirm with the user.

## Core working rules

### 1. Explain before doing
- Before making a change (new file, edit, deletion, running a command), state
  in one or two sentences what you're about to do and why.
- For anything non-trivial (new scripts, restructuring, dependency changes),
  describe the plan and wait for confirmation if the request is ambiguous.
- Don't silently make unrelated "improvements" while completing a task.

### 2. Use approved, working methods — not intuition or improvisation
- Before writing new parsing/processing logic, check whether a working method
  already exists in the repo (e.g. an existing script, a documented approach
  in `/memories/repo/`) and reuse/extend it instead of inventing a new one.
- If an existing approach is broken or insufficient, fix or replace it
  explicitly and say so — don't leave a second, slightly-different version
  next to the original "just in case."
- When a method is verified to work (e.g. a parser that correctly produces
  `parsed_plan.json` for all 100 days), record it in `/memories/repo/` so
  future sessions reuse it instead of re-deriving it from scratch.
- Avoid guessing library APIs, file formats, or data shapes — inspect the
  actual source file (e.g. the Solid Starts `.txt`/`.pdf`) or run the code to
  confirm before relying on it.

### 3. Prefer clear structure over multiple repetitive files
- Do not create near-duplicate files (e.g. `parse_plan.py` / `parse_plan2.py`)
  to try variations. Iterate on one canonical script/module per responsibility
  instead, using version control history for past attempts.
- If two approaches genuinely need to coexist temporarily, say so explicitly
  and note which one is canonical; otherwise consolidate and delete the
  superseded file.
- Organize code by responsibility (e.g. parsing, data models, app logic) in a
  small number of well-named files/folders rather than scattering similar
  logic across many files.

### 4. Ask when the goal or design isn't clear — don't assume
- If the project's main goal, intended users, or how a piece fits into the
  overall app is unclear, ask before proceeding instead of guessing.
- When there's a significant design decision or multiple viable options
  (e.g. data format, file/folder layout, libraries, architecture), present
  the options and trade-offs and ask which to use rather than picking one
  silently.
- This applies especially now, while the project is early-stage and largely
  undefined — treat unstated requirements as unknown, not as default to your
  own judgment.
- It's fine to proceed without asking for small, obviously reversible, or
  clearly-implied steps; reserve questions for choices that would be
  costly or awkward to undo later.

### 5. Maintain the cross-machine session log
- This project is opened from multiple computers, so continuity can't rely on
  anything local to one machine. `/memories/repo/` notes live in VS Code's
  local workspace storage and do **not** travel with the project — treat them
  only as same-machine scratch notes, never as the source of truth.
- `.github/SESSION_LOG.md` is the authoritative, version-controlled record of
  progress across sessions and machines.
- **At the start of every conversation**, read `.github/SESSION_LOG.md`
  (at least the "Key Design Decisions" section and the last dated entry)
  before doing anything else, to see what the previous session did, the
  current state, and any open questions/next steps.
- **Before ending a session** (or after completing a meaningful chunk of
  work), append a new dated entry to `.github/SESSION_LOG.md` with: what was
  done, the resulting state, and open questions/next steps. Keep it short —
  bullet points, not a full transcript.
- If a session settles a product/design decision (feature scope, platform
  choice, data format, architecture, etc.) rather than just a code change,
  also add it to the "Key Design Decisions" section so it stays visible and
  isn't buried in a dated entry.
- Never delete or rewrite past entries; append only, oldest to newest.

## Current known cleanup items
- None blocking. The earlier `parse_plan.py` / `parse_plan2.py` duplication
  was resolved on 2026-10-22 by replacing both with the
  `extract_recipes.py` + `merge_recipes.py` pipeline above.
- Whenever `app/data/plan.json` or any file under `app/` changes, bump
  `CACHE_NAME` in `app/service-worker.js`, otherwise phones with the app
  installed keep serving the old cached version.
