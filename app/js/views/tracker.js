import { store } from "../store.js";
import { iconFor, categoryFor, CATEGORY_ORDER, CATEGORY_ICON, allergenFor } from "../categories.js";
import { PLAN, viewState, todayISO, fmtDate, escapeHTML, REACTIONS, reactionLabel, allKnownFoods } from "./shared.js";

/* ---------------- Tracker ---------------- */

// search box can refresh just this part and keep the keyboard open.
function trackerResultsHTML(foods, state) {
  const isTried = (f) => state.foodTracker[f]?.status === "tried";
  const filtered = foods.filter((f) => {
    const tried = isTried(f);
    if (viewState.trackerFilter === "tried" && !tried) return false;
    if (viewState.trackerFilter === "nottried" && tried) return false;
    if (viewState.trackerCategory !== "all" && categoryFor(f) !== viewState.trackerCategory) return false;
    if (viewState.trackerAllergens && !allergenFor(f)) return false;
    if (viewState.trackerQuery && !f.toLowerCase().includes(viewState.trackerQuery.toLowerCase())) return false;
    return true;
  });
  const catTotals = {}, catTried = {};
  foods.forEach((f) => {
    const c = categoryFor(f);
    catTotals[c] = (catTotals[c] || 0) + 1;
    if (isTried(f)) catTried[c] = (catTried[c] || 0) + 1;
  });
  // Allergens are a sub-group inside each major category: they are listed
  // first under their own sub-heading. The Allergens chip hides everything
  // else but keeps the category grouping.
  const grouped = CATEGORY_ORDER.filter((c) => catTotals[c])
    .map((c) => {
      const items = filtered.filter((f) => categoryFor(f) === c);
      return { name: c, icon: CATEGORY_ICON[c], tried: catTried[c] || 0, total: catTotals[c],
               allergens: items.filter(allergenFor), others: items.filter((f) => !allergenFor(f)) };
    })
    .filter((g) => g.allergens.length || g.others.length);
  return grouped.map((g) => `
    <div class="card">
      <h2 class="category-title">${g.icon} ${escapeHTML(g.name)} <span class="chip-count">${g.tried}/${g.total} tried</span></h2>
      ${g.allergens.length ? `
      <h3 class="sub-title allergen">⚠ Allergens</h3>
      <ul class="food-list">${g.allergens.map((f) => foodRowHTML(f, state)).join("")}</ul>` : ""}
      ${g.others.length ? `
      ${g.allergens.length ? '<h3 class="sub-title">Other foods</h3>' : ""}
      <ul class="food-list">${g.others.map((f) => foodRowHTML(f, state)).join("")}</ul>` : ""}
    </div>`).join("") || '<div class="card"><p class="empty-state">No foods match.</p></div>';
}

function refreshTrackerResults() {
  const results = document.getElementById("tracker-results");
  if (!results) return;
  results.innerHTML = trackerResultsHTML(allKnownFoods(), store.getState());
  attachFoodRowHandlers();
  const clear = document.getElementById("tracker-clear");
  if (clear) clear.classList.toggle("hidden", !viewState.trackerQuery);
  document.querySelectorAll("#activity-grid .tile").forEach((t) => t.classList.toggle("selected", t.dataset.tileFood === viewState.trackerQuery));
}

export function renderTracker() {
  document.getElementById("day-badge").textContent = "Food Tracker";
  const view = document.getElementById("view");
  const foods = allKnownFoods();
  const state = store.getState();

  const isTried = (f) => state.foodTracker[f]?.status === "tried";
  const triedCount = foods.filter(isTried).length;
  const catTotals = {}, catTried = {};
  foods.forEach((f) => {
    const c = categoryFor(f);
    catTotals[c] = (catTotals[c] || 0) + 1;
    if (isTried(f)) catTried[c] = (catTried[c] || 0) + 1;
  });
  const categories = CATEGORY_ORDER.filter((c) => catTotals[c]);
  const allergenFoods = foods.filter(allergenFor);
  const allergenTried = allergenFoods.filter(isTried).length;
  const categoryChips = `
      <div class="chip-scroll">
        <button class="reaction-btn ${viewState.trackerCategory === "all" ? "selected" : ""}" data-category="all">All</button>
        <button class="reaction-btn allergen-chip ${viewState.trackerAllergens ? "selected" : ""}" id="allergen-chip">⚠ Allergens <span class="chip-count">${allergenTried}/${allergenFoods.length}</span></button>
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
        <input type="search" id="tracker-search" placeholder="Search foods..." value="${escapeHTML(viewState.trackerQuery)}" autocomplete="off">
        <button class="btn ${viewState.trackerQuery ? "" : "hidden"}" id="tracker-clear">✕ Show all</button>
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
      <p class="hint">Adds it to the list as not tried; mark it tried when it has been offered.</p>
      <div style="display:flex; gap:8px;">
        <input type="text" id="custom-food-input" placeholder="e.g. Avocado">
        <button class="btn btn-primary" id="add-custom-food">Add</button>
      </div>
    </div>

    <div id="tracker-results">
      ${trackerResultsHTML(foods, state)}
    </div>
  `;

  renderActivityGrid(foods, state);

  document.getElementById("tracker-search").addEventListener("input", (e) => {
    viewState.trackerQuery = e.target.value;
    refreshTrackerResults();
  });
  document.getElementById("tracker-clear").addEventListener("click", () => { viewState.trackerQuery = ""; renderTracker(); });
  view.querySelectorAll("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => { viewState.trackerFilter = btn.dataset.filter; renderTracker(); });
  });
  document.getElementById("allergen-chip").addEventListener("click", () => {
    viewState.trackerAllergens = !viewState.trackerAllergens;
    renderTracker();
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
    const existing = allKnownFoods().find((f) => f.toLowerCase() === name.toLowerCase());
    if (existing) {
      viewState.trackerQuery = existing;
    } else {
      store.addCustomFood(name);
      viewState.trackerQuery = name;
    }
    viewState.trackerCategory = "all";
    viewState.trackerAllergens = false;
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
          <div class="food-name">${escapeHTML(food)}${allergenFor(food) ? ` <span class="allergen-badge">⚠ ${escapeHTML(allergenFor(food))}</span>` : ""}</div>
          <div class="food-meta">${tried ? triedMeta(entry) : "Not tried yet"}</div>
        </div>
        <button class="status-chip ${tried ? "tried" : "not-tried"}" data-toggle="${escapeHTML(food)}">${tried ? "Tried ✓" : "Mark tried"}</button>
        ${!tried && store.isCustomFood(food) ? `<button class="try-remove" data-remove-custom="${escapeHTML(food)}" aria-label="Remove ${escapeHTML(food)} from the list">✕</button>` : ""}
      </div>
      ${tried ? `
      ${triesHTML(food, entry)}
      ${foodNotesHTML(food, entry)}
      ` : ""}
    </li>`;
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
  document.querySelectorAll("[data-remove-custom]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!confirm(`Remove ${btn.dataset.removeCustom} from the list?`)) return;
      store.removeCustomFood(btn.dataset.removeCustom);
      if (viewState.trackerQuery === btn.dataset.removeCustom) viewState.trackerQuery = "";
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
