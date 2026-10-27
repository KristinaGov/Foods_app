import { store } from "./store.js";
import { iconFor, categoryFor, CATEGORY_ORDER, CATEGORY_ICON } from "./categories.js";
import { sync } from "./sync.js";

const BACKUP_REMINDER_DAYS = 14;

// Shown on Today when data exists on this phone only and no export was made
// recently. Disappears once GitHub backup is connected or a file is exported.
function backupNoticeHTML() {
  if (sync.isConnected() || !store.hasUserData()) return "";
  const last = sync.getConfig().lastExportAt;
  const ageDays = last ? (Date.now() - new Date(last).getTime()) / 86400000 : Infinity;
  if (ageDays < BACKUP_REMINDER_DAYS) return "";
  return `
    <div class="card notice">
      <strong>Your data lives only on this phone.</strong>
      <p class="hint" style="margin-top:4px;">${last ? `Last backup file was exported ${Math.floor(ageDays)} days ago.` : "No backup yet."} Export a backup file or connect GitHub in Settings so a reinstall or a new phone doesn't lose your tracker and notes.</p>
      <button class="btn" id="notice-open-settings" style="margin-top:8px;">Open Settings</button>
    </div>`;
}

function attachBackupNotice() {
  const btn = document.getElementById("notice-open-settings");
  if (btn) btn.addEventListener("click", () => document.getElementById("settings-btn").click());
}

let PLAN = [];
let WEEKS = [];
let GROCERIES = {};
// editingNotesFor: ISO date whose notes textarea is open (null = none).
// editingFoodNote: food name whose Tracker note textarea is open.
// overviewWeek / groceryWeek: plan week shown on the Weeks / Grocery tab (null = current week).
let viewState = { todayDayOffset: 0, trackerFilter: "all", trackerQuery: "", trackerCategory: "all", editingNotesFor: null, editingFoodNote: null, overviewWeek: null, groceryWeek: null };

export function setPlan(plan) {
  PLAN = plan;
}

export function setWeeks(weeks) {
  WEEKS = weeks;
}

export function setGroceries(groceries) {
  GROCERIES = groceries;
}

function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function fmtDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function dayData(dayNumber) {
  return PLAN.find((d) => d.day === dayNumber) || null;
}

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function stepsHTML(instructions) {
  // Instructions are either "1. ... 2. ..." numbered steps, or a plain paragraph
  // of "Prepare the X. ..." sentences; render numbered steps as a list either way.
  const numbered = instructions.match(/\d+\.\s/) ;
  const parts = numbered
    ? instructions.split(/(?=\d+\.\s)/).map((s) => s.replace(/^\d+\.\s*/, "").trim()).filter(Boolean)
    : instructions.split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
  return `<ol class="food-list">${parts.map((s) => `<li>${escapeHTML(s)}</li>`).join("")}</ol>`;
}

function recipeCardHTML(rec) {
  const meta = [rec.yield, rec.cookTime ? `Cook time: ${rec.cookTime}` : ""].filter(Boolean).join(" · ");
  const isFamily = rec.mealType.includes("Family");
  return `
    <div class="recipe-block">
      ${isFamily ? '<span class="pill outline">Family meal to share</span>' : ""}
      <h3 style="text-transform:none; letter-spacing:normal; font-size:1rem; color:var(--text);">${escapeHTML(rec.title)}</h3>
      ${meta ? `<p class="food-meta">${escapeHTML(meta)}</p>` : ""}
      <details>
        <summary class="btn" style="display:inline-block; cursor:pointer;">Show recipe</summary>
        <div style="margin-top:10px;">
          ${rec.ingredients.length ? `<h3>Ingredients</h3><ul class="food-list">${rec.ingredients.map((i) => `<li>${escapeHTML(i)}</li>`).join("")}</ul>` : ""}
          ${rec.instructions ? `<h3>Steps</h3>${stepsHTML(rec.instructions)}` : ""}
          ${rec.howToServe ? `<h3>How to serve</h3><p>${escapeHTML(rec.howToServe)}</p>` : ""}
          ${rec.howToStore ? `<h3>How to store</h3><p>${escapeHTML(rec.howToStore)}</p>` : ""}
        </div>
      </details>
    </div>`;
}

const REACTIONS = [
  { key: "none", label: "No reaction" },
  { key: "liked", label: "😋 Liked it" },
  { key: "neutral", label: "😐 Neutral" },
  { key: "disliked", label: "😖 Disliked" },
  { key: "rash", label: "🔴 Rash/allergy" }
];

/* ---------------- Today ---------------- */

export function renderToday() {
  const state = store.getState();
  const view = document.getElementById("view");

  if (!state.startDate) {
    view.innerHTML = `
      <div class="card empty-state">
        <p>Set your baby's Day 1 date to see today's plan.</p>
        <button class="btn btn-primary" id="goto-settings">Set start date</button>
      </div>`;
    document.getElementById("goto-settings").addEventListener("click", () => {
      document.getElementById("settings-modal").classList.remove("hidden");
    });
    document.getElementById("day-badge").textContent = "Baby Food Plan";
    return;
  }

  const baseDay = store.dayNumberFor(todayISO());
  const dayNumber = baseDay + viewState.todayDayOffset;
  const iso = store.isoDateForDay(dayNumber);
  const data = dayNumber >= 1 && dayNumber <= 100 ? dayData(dayNumber) : null;
  const log = store.getDailyLog(iso) || {};

  document.getElementById("day-badge").textContent =
    dayNumber >= 1 && dayNumber <= 100 ? `Day ${dayNumber} of 100` : "Baby Food Plan";

  if (!data) {
    view.innerHTML = `
      <div class="day-nav">
        <button id="prev-day">‹</button>
        <span class="current-date">${fmtDate(iso)}${viewState.todayDayOffset ? '<br><button class="today-btn" id="back-today">↩ Back to today</button>' : ""}</span>
        <button id="next-day">›</button>
      </div>
      <div class="card empty-state"><p>${dayNumber < 1 ? "Before Day 1 of the plan." : "Past Day 100 — the plan ends here. 🎉"}</p></div>`;
    attachDayNav();
    return;
  }

  const newFoodsHTML = data.newFoods.map((f) => {
    const triedToday = store.tryIndexOn(f, iso) >= 0;
    const triedBefore = !triedToday && store.getFoodEntry(f)?.status === "tried";
    return `<button class="pill ${triedToday ? "" : "outline"} new-food-pill" data-food="${escapeHTML(f)}">${triedToday ? "✓ " : triedBefore ? "↻ " : ""}${escapeHTML(f)}</button>`;
  }).join("");
  const allergensHTML = data.allergens.map((a) => `<span class="pill allergen">⚠ ${escapeHTML(a)}</span>`).join("");
  const recipesHTML = (data.recipes || []).map(recipeCardHTML).join("");

  // A saved note is shown as text with an Edit button; the textarea only
  // appears while there is nothing saved yet or the user tapped Edit.
  const hasNote = Boolean((log.notes || "").trim());
  const editing = viewState.editingNotesFor === iso || !hasNote;
  const notesHTML = editing
    ? `
      <textarea id="day-notes" placeholder="Any notes about today's meals or reactions...">${escapeHTML(log.notes || "")}</textarea>
      <div class="note-actions">
        <button class="btn btn-primary" id="save-day-notes">Save</button>
        ${hasNote ? '<button class="btn" id="cancel-day-notes">Cancel</button>' : ""}
      </div>`
    : `
      <div class="saved-note">${escapeHTML(log.notes)}</div>
      <div class="note-actions">
        <span class="saved-badge">✓ Saved</span>
        <button class="btn" id="edit-day-notes">Edit</button>
      </div>`;

  view.innerHTML = `
    ${backupNoticeHTML()}
    <div class="day-nav">
      <button id="prev-day">‹</button>
      <span class="current-date">${fmtDate(iso)}${viewState.todayDayOffset ? '<br><button class="today-btn" id="back-today">↩ Back to today</button>' : ""}</span>
      <button id="next-day">›</button>
    </div>

    <div class="card">
      <h2>🍽 What to cook</h2>
      ${recipesHTML || '<p class="empty-state">No recipe details for this day.</p>'}
    </div>

    ${data.newFoods.length ? `
    <div class="card">
      <h2>🆕 New foods today</h2>
      <p class="hint">Tap a food once it's been offered to log a try for this day (↻ = tried on an earlier day). Reactions per try are set in the Tracker.</p>
      <div>${newFoodsHTML}</div>
    </div>` : ""}

    ${allergensHTML ? `
    <div class="card">
      <h2>⚠️ Allergens introduced</h2>
      <div>${allergensHTML}</div>
    </div>` : ""}

    <div class="card">
      <h2>📝 Today's notes</h2>
      <p class="hint">How did baby react overall today?</p>
      <div class="reaction-row" id="day-reaction-row">
        ${REACTIONS.map((r) => `<button class="reaction-btn ${log.reaction === r.key ? "selected" : ""}" data-reaction="${r.key}">${r.label}</button>`).join("")}
      </div>
      ${notesHTML}
    </div>
  `;

  attachDayNav();
  attachBackupNotice();

  view.querySelectorAll(".new-food-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      const food = btn.dataset.food;
      const idx = store.tryIndexOn(food, iso);
      if (idx >= 0) store.removeTry(food, idx);
      else store.addTry(food, { date: iso });
      renderToday();
    });
  });

  view.querySelectorAll("#day-reaction-row .reaction-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      store.setDailyLog(iso, { day: dayNumber, reaction: btn.dataset.reaction });
      renderToday();
    });
  });

  const saveBtn = document.getElementById("save-day-notes");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const notes = document.getElementById("day-notes").value.trim();
      store.setDailyLog(iso, { day: dayNumber, notes });
      viewState.editingNotesFor = null;
      renderToday();
    });
  }
  const cancelBtn = document.getElementById("cancel-day-notes");
  if (cancelBtn) cancelBtn.addEventListener("click", () => { viewState.editingNotesFor = null; renderToday(); });
  const editBtn = document.getElementById("edit-day-notes");
  if (editBtn) {
    editBtn.addEventListener("click", () => {
      viewState.editingNotesFor = iso;
      renderToday();
      document.getElementById("day-notes").focus();
    });
  }

  function attachDayNav() {
    document.getElementById("prev-day").addEventListener("click", () => { viewState.todayDayOffset -= 1; renderToday(); });
    document.getElementById("next-day").addEventListener("click", () => { viewState.todayDayOffset += 1; renderToday(); });
    const back = document.getElementById("back-today");
    if (back) back.addEventListener("click", () => { viewState.todayDayOffset = 0; renderToday(); });
  }
}

/* ---------------- Tracker ---------------- */

function allKnownFoods() {
  const fromPlan = new Set();
  PLAN.forEach((d) => d.newFoods.forEach((f) => fromPlan.add(f)));
  const fromTracker = Object.keys(store.getState().foodTracker);
  fromTracker.forEach((f) => fromPlan.add(f));
  return Array.from(fromPlan).sort((a, b) => a.localeCompare(b));
}

export function renderTracker() {
  document.getElementById("day-badge").textContent = "Food Tracker";
  const view = document.getElementById("view");
  const foods = allKnownFoods();
  const state = store.getState();

  const isTried = (f) => state.foodTracker[f]?.status === "tried";
  const filtered = foods.filter((f) => {
    const tried = isTried(f);
    if (viewState.trackerFilter === "tried" && !tried) return false;
    if (viewState.trackerFilter === "nottried" && tried) return false;
    if (viewState.trackerCategory !== "all" && categoryFor(f) !== viewState.trackerCategory) return false;
    if (viewState.trackerQuery && !f.toLowerCase().includes(viewState.trackerQuery.toLowerCase())) return false;
    return true;
  });

  const triedCount = foods.filter(isTried).length;

  // Per-category counts (over all foods, independent of the current filters)
  // for the chips, and the filtered list grouped by category for display.
  const catTotals = {}, catTried = {};
  foods.forEach((f) => {
    const c = categoryFor(f);
    catTotals[c] = (catTotals[c] || 0) + 1;
    if (isTried(f)) catTried[c] = (catTried[c] || 0) + 1;
  });
  const categories = CATEGORY_ORDER.filter((c) => catTotals[c]);
  const grouped = categories
    .map((c) => ({ name: c, items: filtered.filter((f) => categoryFor(f) === c) }))
    .filter((g) => g.items.length);
  const categoryChips = `
      <div class="chip-scroll">
        <button class="reaction-btn ${viewState.trackerCategory === "all" ? "selected" : ""}" data-category="all">All</button>
        ${categories.map((c) => `<button class="reaction-btn ${viewState.trackerCategory === c ? "selected" : ""}" data-category="${escapeHTML(c)}">${CATEGORY_ICON[c]} ${escapeHTML(c)} <span class="chip-count">${catTried[c] || 0}/${catTotals[c]}</span></button>`).join("")}
      </div>`;

  view.innerHTML = `
    <div class="card activity-card">
      <div class="activity-head">
        <h2>${triedCount} of ${foods.length} foods tried</h2>
        <span class="activity-legend"><span class="tile t0"></span><span class="tile t1"></span><span class="tile t2"></span><span class="tile t3"></span></span>
      </div>
      <div class="activity-grid" id="activity-grid" role="img" aria-label="${triedCount} of ${foods.length} foods tried"></div>
    </div>

    <div class="card search-bar">
      <div class="search-row">
        <input type="search" id="tracker-search" placeholder="Search foods..." value="${escapeHTML(viewState.trackerQuery)}">
        ${viewState.trackerQuery ? '<button class="btn" id="tracker-clear">✕ Show all</button>' : ""}
      </div>
      <div class="reaction-row" style="margin-top:10px;">
        <button class="reaction-btn ${viewState.trackerFilter === "all" ? "selected" : ""}" data-filter="all">All (${foods.length})</button>
        <button class="reaction-btn ${viewState.trackerFilter === "tried" ? "selected" : ""}" data-filter="tried">Tried (${triedCount})</button>
        <button class="reaction-btn ${viewState.trackerFilter === "nottried" ? "selected" : ""}" data-filter="nottried">Not tried (${foods.length - triedCount})</button>
      </div>
      ${categoryChips}
    </div>

    <div class="card">
      <h2>Add a food</h2>
      <div style="display:flex; gap:8px;">
        <input type="text" id="custom-food-input" placeholder="e.g. Avocado">
        <button class="btn btn-primary" id="add-custom-food">Add</button>
      </div>
    </div>

    ${grouped.map((g) => `
    <div class="card">
      <h2 class="category-title">${CATEGORY_ICON[g.name]} ${escapeHTML(g.name)} <span class="chip-count">${catTried[g.name] || 0}/${catTotals[g.name]} tried</span></h2>
      <ul class="food-list">
        ${g.items.map((f) => foodRowHTML(f, state)).join("")}
      </ul>
    </div>`).join("") || '<div class="card"><p class="empty-state">No foods match.</p></div>'}
  `;

  renderActivityGrid(foods, state);

  document.getElementById("tracker-search").addEventListener("input", (e) => {
    viewState.trackerQuery = e.target.value;
    renderTracker();
  });
  const clearBtn = document.getElementById("tracker-clear");
  if (clearBtn) clearBtn.addEventListener("click", () => { viewState.trackerQuery = ""; renderTracker(); });
  view.querySelectorAll("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => { viewState.trackerFilter = btn.dataset.filter; renderTracker(); });
  });
  view.querySelectorAll("[data-category]").forEach((btn) => {
    btn.addEventListener("click", () => {
      viewState.trackerCategory = viewState.trackerCategory === btn.dataset.category ? "all" : btn.dataset.category;
      renderTracker();
    });
  });
  document.getElementById("add-custom-food").addEventListener("click", () => {
    const input = document.getElementById("custom-food-input");
    const name = input.value.trim();
    if (!name) return;
    store.markFood(name, { status: "tried", date: todayISO() });
    renderTracker();
  });

  attachFoodRowHandlers();
}

// GitHub-style activity grid: one tile per food, in the order the plan
// introduces them (custom foods last). Tile size and column count are
// chosen from the actual screen so the whole card stays within a third of
// the app's content area; the grid is laid out widest-first and shrinks the
// tiles until all rows fit.
const GRID_MAX_SHARE = 1 / 3;
const GRID_CARD_OVERHEAD = 84; // card padding + heading row + margin, in px

function planOrder() {
  const order = new Map();
  PLAN.forEach((d) => d.newFoods.forEach((f) => { if (!order.has(f)) order.set(f, d.day); }));
  return order;
}

function tileLevel(entry) {
  if (!entry || entry.status !== "tried") return "t0";
  if (entry.reaction === "rash") return "rash";
  const n = (entry.tries || []).length;
  return n >= 3 ? "t3" : n === 2 ? "t2" : "t1";
}

function renderActivityGrid(foods, state) {
  const grid = document.getElementById("activity-grid");
  const view = document.getElementById("view");
  if (!grid || !view) return;

  const order = planOrder();
  const sorted = foods.slice().sort((a, b) => {
    const da = order.get(a) ?? 999, db = order.get(b) ?? 999;
    return da - db || a.localeCompare(b);
  });

  const width = grid.clientWidth || 300;
  const maxHeight = Math.max(40, view.clientHeight * GRID_MAX_SHARE - GRID_CARD_OVERHEAD);
  let size = 4, gap = 2, cols = 1;
  for (let s = 22; s >= 4; s--) {
    const g = Math.max(2, Math.round(s * 0.22));
    const c = Math.max(1, Math.floor((width + g) / (s + g)));
    const rows = Math.ceil(sorted.length / c);
    if (rows * (s + g) - g <= maxHeight) { size = s; gap = g; cols = c; break; }
  }

  grid.style.gridTemplateColumns = `repeat(${cols}, ${size}px)`;
  grid.style.gap = `${gap}px`;
  grid.style.setProperty("--tile", `${size}px`);
  grid.innerHTML = sorted.map((f) => {
    const entry = state.foodTracker[f];
    const lvl = tileLevel(entry);
    const tries = entry?.tries?.length || 0;
    const title = `${f}${tries ? ` · tried ${tries}×` : " · not tried"}`;
    const selected = viewState.trackerQuery === f ? " selected" : "";
    return `<button class="tile ${lvl}${selected}" data-tile-food="${escapeHTML(f)}" title="${escapeHTML(title)}" aria-label="${escapeHTML(title)}"></button>`;
  }).join("");

  // Tap a tile to show just that food; tap it again (or "Show all") to clear.
  grid.querySelectorAll("[data-tile-food]").forEach((t) => {
    t.addEventListener("click", () => {
      viewState.trackerQuery = viewState.trackerQuery === t.dataset.tileFood ? "" : t.dataset.tileFood;
      renderTracker();
    });
  });
}

// Re-fit the grid when the screen rotates or the window is resized.
let resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { if (document.getElementById("activity-grid")) renderTracker(); }, 150);
});

function foodRowHTML(food, state) {
  const entry = state.foodTracker[food];
  const tried = entry && entry.status === "tried";
  return `
    <li class="food-row-wrap" data-food="${escapeHTML(food)}">
      <div class="food-row">
        <span class="food-icon" aria-hidden="true">${iconFor(food)}</span>
        <div class="food-row-text">
          <div class="food-name">${escapeHTML(food)}</div>
          <div class="food-meta">${tried ? triedMeta(entry) : "Not tried yet"}</div>
        </div>
        <button class="status-chip ${tried ? "tried" : "not-tried"}" data-toggle="${escapeHTML(food)}">${tried ? "Tried ✓" : "Mark tried"}</button>
      </div>
      ${tried ? `
      ${triesHTML(food, entry)}
      ${foodNotesHTML(food, entry)}
      ` : ""}
    </li>`;
}

function reactionLabel(key) {
  return REACTIONS.find((r) => r.key === key)?.label || key;
}

function triedMeta(entry) {
  const n = entry.tries.length;
  const latest = entry.reaction && entry.reaction !== "none" ? ` • last: ${reactionLabel(entry.reaction)}` : "";
  return `First tried ${fmtDate(entry.firstDate)} • ${n} ${n === 1 ? "try" : "tries"}${latest}`;
}

// One row per try: editable date, reaction picker, remove. Newest first.
function triesHTML(food, entry) {
  const f = escapeHTML(food);
  const rows = entry.tries.map((t, i) => ({ t, i })).reverse().map(({ t, i }) => `
    <div class="try-row">
      <input type="date" value="${t.date}" data-try-date="${f}" data-idx="${i}" aria-label="Date tried">
      <select data-try-reaction="${f}" data-idx="${i}" aria-label="Reaction">
        ${REACTIONS.map((r) => `<option value="${r.key}" ${t.reaction === r.key ? "selected" : ""}>${r.label}</option>`).join("")}
      </select>
      <button class="try-remove" data-try-remove="${f}" data-idx="${i}" aria-label="Remove this try">✕</button>
    </div>`).join("");
  return `
    <div class="try-list">
      ${rows}
      <button class="btn try-add" data-add-try="${f}">+ Add another try</button>
    </div>`;
}

// Same pattern as Today's notes: saved text + Edit, textarea only while
// empty or being edited.
function foodNotesHTML(food, entry) {
  const hasNote = Boolean((entry.notes || "").trim());
  const editing = viewState.editingFoodNote === food || !hasNote;
  const f = escapeHTML(food);
  if (editing) {
    return `
      <textarea class="food-notes" data-notes-food="${f}" placeholder="Notes on this food...">${escapeHTML(entry.notes || "")}</textarea>
      <div class="note-actions">
        <button class="btn btn-primary" data-save-note="${f}">Save</button>
        ${hasNote ? `<button class="btn" data-cancel-note="${f}">Cancel</button>` : ""}
      </div>`;
  }
  return `
      <div class="saved-note">${escapeHTML(entry.notes)}</div>
      <div class="note-actions">
        <span class="saved-badge">✓ Saved</span>
        <button class="btn" data-edit-note="${f}">Edit</button>
      </div>`;
}

function attachFoodRowHandlers() {
  document.querySelectorAll("[data-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const food = btn.dataset.toggle;
      const entry = store.getFoodEntry(food);
      if (entry && entry.status === "tried") {
        const n = entry.tries.length;
        if (n > 1 && !confirm(`Remove all ${n} tries of ${food} and its notes?`)) return;
        store.unmarkFood(food);
      } else {
        store.addTry(food, { date: todayISO() });
      }
      renderTracker();
    });
  });
  document.querySelectorAll("[data-add-try]").forEach((btn) => {
    btn.addEventListener("click", () => { store.addTry(btn.dataset.addTry, { date: todayISO() }); renderTracker(); });
  });
  document.querySelectorAll("[data-try-date]").forEach((input) => {
    input.addEventListener("change", () => {
      if (!input.value) return;
      store.updateTry(input.dataset.tryDate, Number(input.dataset.idx), { date: input.value });
      renderTracker();
    });
  });
  document.querySelectorAll("[data-try-reaction]").forEach((sel) => {
    sel.addEventListener("change", () => {
      store.updateTry(sel.dataset.tryReaction, Number(sel.dataset.idx), { reaction: sel.value });
      renderTracker();
    });
  });
  document.querySelectorAll("[data-try-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const food = btn.dataset.tryRemove;
      const entry = store.getFoodEntry(food);
      if (entry.tries.length === 1 && !confirm(`This is the only try of ${food}. Remove it and mark the food as not tried?`)) return;
      store.removeTry(food, Number(btn.dataset.idx));
      renderTracker();
    });
  });
  document.querySelectorAll("[data-save-note]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const food = btn.dataset.saveNote;
      const ta = document.querySelector(`.food-notes[data-notes-food="${CSS.escape(food)}"]`);
      store.markFood(food, { notes: ta.value.trim() });
      viewState.editingFoodNote = null;
      renderTracker();
    });
  });
  document.querySelectorAll("[data-cancel-note]").forEach((btn) => {
    btn.addEventListener("click", () => { viewState.editingFoodNote = null; renderTracker(); });
  });
  document.querySelectorAll("[data-edit-note]").forEach((btn) => {
    btn.addEventListener("click", () => {
      viewState.editingFoodNote = btn.dataset.editNote;
      renderTracker();
      document.querySelector(`.food-notes[data-notes-food="${CSS.escape(btn.dataset.editNote)}"]`)?.focus();
    });
  });
}

/* ---------------- Grocery ---------------- */

// Returns the groceries.json entry for a plan week plus the key used for
// persisting checkmarks. Weeks 14 and 15 share one list in the PDF.
function groceryWeek(week) {
  const shared = week >= 14;
  return { list: GROCERIES[String(week)] || [], key: shared ? "week-14+15" : `week-${week}`, label: shared ? "Weeks 14 + 15" : `Week ${week}` };
}

export function renderGrocery() {
  const view = document.getElementById("view");
  // Weeks 14 and 15 are one shopping list (and one page) here.
  const GROCERY_LAST = 14;
  const week = Math.min(GROCERY_LAST, viewState.groceryWeek ?? currentWeekNumber());
  viewState.groceryWeek = week;
  const { list, key, label } = groceryWeek(week);
  const days = PLAN.filter((d) => (week >= GROCERY_LAST ? Number(d.week) >= GROCERY_LAST : Number(d.week) === week));
  const hasDates = Boolean(store.getState().startDate);

  document.getElementById("day-badge").textContent = "Grocery List";

  const firstDay = days[0]?.day;
  const lastDay = days[days.length - 1]?.day;
  const rangeLabel = days.length && hasDates
    ? `${fmtDate(store.isoDateForDay(firstDay))} – ${fmtDate(store.isoDateForDay(lastDay))}`
    : days.length ? `Days ${firstDay}–${lastDay}` : "";

  const checks = store.getGroceryChecks(key);
  const total = list.reduce((n, s) => n + s.items.length, 0);
  const done = list.reduce((n, s) => n + s.items.filter((it) => checks[it.item]).length, 0);

  const sections = list.map((section) => `
      <div class="grocery-category">
        <h3>${escapeHTML(section.name)}${section.name.startsWith("Check for Leftovers") ? ' <span class="hint-inline">bought in an earlier week</span>' : ""}</h3>
        ${section.items.map((it) => {
          const isAlt = /substitute/i.test(it.note);
          return `
          <label class="grocery-item ${checks[it.item] ? "checked" : ""}">
            <input type="checkbox" data-grocery-item="${escapeHTML(it.item)}" ${checks[it.item] ? "checked" : ""}>
            <span class="grocery-text">
              <span class="grocery-line"><span class="grocery-name">${escapeHTML(it.item)}</span><span class="grocery-qty">${escapeHTML(it.qty)}</span></span>
              ${it.note ? `<span class="grocery-note ${isAlt ? "alt" : ""}">${isAlt ? "⇄ " : ""}${escapeHTML(it.note)}</span>` : ""}
            </span>
          </label>`;
        }).join("")}
      </div>`).join("");

  const mealsPreview = days.map((d) => `
    <div class="food-meta" style="margin-bottom:4px;">
      <strong>Day ${d.day}:</strong> ${escapeHTML(d.meals.join(", "))}${d.familyMeal ? " · Family: " + escapeHTML(d.familyMeal) : ""}
    </div>`).join("");

  view.innerHTML = `
    <div class="day-nav">
      <button id="prev-week" ${week <= 1 ? "disabled" : ""}>‹</button>
      <span class="current-date">${label}${rangeLabel ? "<br><span class='food-meta'>" + rangeLabel + "</span>" : ""}</span>
      <button id="next-week" ${week >= GROCERY_LAST ? "disabled" : ""}>›</button>
    </div>

    <div class="card">
      <h2>🛒 Shopping list${total ? ` <span class="grocery-count">${done}/${total}</span>` : ""}</h2>
      <p class="hint">The plan's full ingredient list for the week, with quantities. Notes marked ⇄ give alternatives you can buy instead.</p>
      ${sections || '<p class="empty-state">No ingredient list for this week.</p>'}
      ${done ? '<button class="btn btn-link" id="clear-checks">Uncheck all</button>' : ""}
    </div>

    <div class="card">
      <h2>This week's menu</h2>
      ${mealsPreview || '<p class="empty-state">Nothing planned.</p>'}
    </div>
  `;

  document.getElementById("prev-week").addEventListener("click", () => { viewState.groceryWeek = Math.max(1, week - 1); renderGrocery(); });
  document.getElementById("next-week").addEventListener("click", () => { viewState.groceryWeek = Math.min(GROCERY_LAST, week + 1); renderGrocery(); });

  view.querySelectorAll("[data-grocery-item]").forEach((cb) => {
    cb.addEventListener("change", () => {
      const current = store.getGroceryChecks(key);
      current[cb.dataset.groceryItem] = cb.checked;
      store.setGroceryChecks(key, current);
      renderGrocery();
    });
  });
  const clear = document.getElementById("clear-checks");
  if (clear) clear.addEventListener("click", () => { store.setGroceryChecks(key, {}); renderGrocery(); });
}

/* ---------------- Weekly overview ---------------- */

const LAST_WEEK = 15;

function weekNumberFor(dayNumber) {
  return Math.min(LAST_WEEK, Math.max(1, Math.ceil(dayNumber / 7)));
}

function currentWeekNumber() {
  const baseDay = store.dayNumberFor(todayISO());
  return baseDay === null ? 1 : weekNumberFor(baseDay);
}

export function renderWeeks() {
  const view = document.getElementById("view");
  const week = viewState.overviewWeek ?? currentWeekNumber();
  viewState.overviewWeek = week;
  const info = WEEKS.find((w) => w.week === week);
  const days = PLAN.filter((d) => Number(d.week) === week);
  const firstDay = days[0]?.day;
  const lastDay = days[days.length - 1]?.day;

  document.getElementById("day-badge").textContent = `Week ${week} of ${LAST_WEEK}`;

  const hasDates = Boolean(store.getState().startDate);
  const rangeLabel = days.length
    ? hasDates
      ? `${fmtDate(store.isoDateForDay(firstDay))} – ${fmtDate(store.isoDateForDay(lastDay))}`
      : `Days ${firstDay}–${lastDay}`
    : "";

  // Allergens that appear in this week's plan but on no earlier day.
  const seenBefore = new Set();
  PLAN.filter((d) => d.day < firstDay).forEach((d) => d.allergens.forEach((a) => seenBefore.add(a)));
  const newAllergens = [];
  days.forEach((d) => d.allergens.forEach((a) => { if (!seenBefore.has(a) && !newAllergens.includes(a)) newAllergens.push(a); }));
  const newFoods = [];
  days.forEach((d) => d.newFoods.forEach((f) => { if (!newFoods.includes(f)) newFoods.push(f); }));
  const familyMeals = days.filter((d) => d.familyMeal).map((d) => d.familyMeal);

  const summaryHTML = info
    ? `
    <div class="card">
      <h2>${escapeHTML(info.title)}</h2>
      ${info.summary.map((para) => `<p>${escapeHTML(para)}</p>`).join("")}
      ${info.tip ? `<p class="week-tip"><strong>Tip:</strong> ${escapeHTML(info.tip)}</p>` : ""}
    </div>`
    : '<div class="card empty-state"><p>No overview for this week.</p></div>';

  const dayRows = days.map((d) => {
    const dateLabel = hasDates ? ` · ${fmtDate(store.isoDateForDay(d.day))}` : "";
    return `
      <div class="week-day-row">
        <div class="food-name">Day ${d.day}${dateLabel}</div>
        <div class="food-meta">${escapeHTML(d.meals.join(", "))}${d.familyMeal ? ` · <em>Family: ${escapeHTML(d.familyMeal)}</em>` : ""}</div>
        ${d.newFoods.length ? `<div class="food-meta">New: ${escapeHTML(d.newFoods.join(", "))}</div>` : ""}
      </div>`;
  }).join("");

  view.innerHTML = `
    <div class="day-nav">
      <button id="prev-week-ov" ${week <= 1 ? "disabled" : ""}>‹</button>
      <span class="current-date">Week ${week}${rangeLabel ? " · " + rangeLabel : ""}</span>
      <button id="next-week-ov" ${week >= LAST_WEEK ? "disabled" : ""}>›</button>
    </div>

    ${summaryHTML}

    <div class="card">
      <h2>This week at a glance</h2>
      ${newAllergens.length ? `<h3>New allergens</h3><div>${newAllergens.map((a) => `<span class="pill allergen">⚠ ${escapeHTML(a)}</span>`).join("")}</div>` : ""}
      ${newFoods.length ? `<h3>New foods (${newFoods.length})</h3><div>${newFoods.map((f) => `<span class="pill outline">${escapeHTML(f)}</span>`).join("")}</div>` : ""}
      ${familyMeals.length ? `<h3>Family meals</h3><p>${escapeHTML(familyMeals.join(", "))}</p>` : ""}
      <h3>Day by day</h3>
      ${dayRows || '<p class="empty-state">Nothing planned.</p>'}
    </div>
  `;

  document.getElementById("prev-week-ov").addEventListener("click", () => { viewState.overviewWeek = Math.max(1, week - 1); renderWeeks(); });
  document.getElementById("next-week-ov").addEventListener("click", () => { viewState.overviewWeek = Math.min(LAST_WEEK, week + 1); renderWeeks(); });
}

/* ---------------- Notes history ---------------- */

export function renderNotes() {
  document.getElementById("day-badge").textContent = "Daily Notes";
  const view = document.getElementById("view");
  const state = store.getState();

  const entries = Object.entries(state.dailyLogs)
    .filter(([, log]) => log.notes || (log.reaction && log.reaction !== "none"))
    .sort(([a], [b]) => b.localeCompare(a));

  if (!entries.length) {
    view.innerHTML = `<div class="card empty-state"><p>No notes yet. Add one from the Today tab.</p></div>`;
    return;
  }

  view.innerHTML = entries.map(([iso, log]) => `
    <div class="card">
      <h2>Day ${log.day ?? "?"} · ${fmtDate(iso)}</h2>
      ${log.reaction && log.reaction !== "none" ? `<span class="pill outline">${REACTIONS.find(r => r.key === log.reaction)?.label || log.reaction}</span>` : ""}
      ${log.notes ? `<p>${escapeHTML(log.notes)}</p>` : ""}
    </div>
  `).join("");
}
