import { store } from "./store.js";
import { CATEGORY_ORDER, categoryFor, isPantryStaple } from "./categories.js";
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
let viewState = { todayDayOffset: 0, weekOffset: 0, trackerFilter: "all", trackerQuery: "" };

export function setPlan(plan) {
  PLAN = plan;
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
        <span class="current-date">${fmtDate(iso)}</span>
        <button id="next-day">›</button>
      </div>
      <div class="card empty-state"><p>${dayNumber < 1 ? "Before Day 1 of the plan." : "Past Day 100 — the plan ends here. 🎉"}</p></div>`;
    attachDayNav();
    return;
  }

  const newFoodsHTML = data.newFoods.map((f) => {
    const entry = store.getFoodEntry(f);
    const tried = entry && entry.status === "tried";
    return `<button class="pill ${tried ? "" : "outline"} new-food-pill" data-food="${escapeHTML(f)}">${tried ? "✓ " : ""}${escapeHTML(f)}</button>`;
  }).join("");
  const allergensHTML = data.allergens.map((a) => `<span class="pill allergen">⚠ ${escapeHTML(a)}</span>`).join("");
  const recipesHTML = (data.recipes || []).map(recipeCardHTML).join("");

  view.innerHTML = `
    ${backupNoticeHTML()}
    <div class="day-nav">
      <button id="prev-day">‹</button>
      <span class="current-date">${fmtDate(iso)}</span>
      <button id="next-day">›</button>
    </div>

    <div class="card">
      <h2>🍽 What to cook</h2>
      ${recipesHTML || '<p class="empty-state">No recipe details for this day.</p>'}
    </div>

    ${data.newFoods.length ? `
    <div class="card">
      <h2>🆕 New foods today</h2>
      <p class="hint">Tap a food once it's been offered to mark it as tried.</p>
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
      <textarea id="day-notes" placeholder="Any notes about today's meals or reactions...">${escapeHTML(log.notes || "")}</textarea>
      <button class="btn btn-primary" id="save-day-notes" style="margin-top:8px;">Save</button>
    </div>
  `;

  attachDayNav();
  attachBackupNotice();

  view.querySelectorAll(".new-food-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      const food = btn.dataset.food;
      const entry = store.getFoodEntry(food);
      if (entry && entry.status === "tried") {
        store.unmarkFood(food);
      } else {
        store.markFood(food, { status: "tried", date: iso });
      }
      renderToday();
    });
  });

  view.querySelectorAll("#day-reaction-row .reaction-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      store.setDailyLog(iso, { day: dayNumber, reaction: btn.dataset.reaction });
      renderToday();
    });
  });

  document.getElementById("save-day-notes").addEventListener("click", () => {
    const notes = document.getElementById("day-notes").value;
    store.setDailyLog(iso, { day: dayNumber, notes });
    document.getElementById("save-day-notes").textContent = "Saved ✓";
    setTimeout(() => { document.getElementById("save-day-notes").textContent = "Save"; }, 1200);
  });

  function attachDayNav() {
    document.getElementById("prev-day").addEventListener("click", () => { viewState.todayDayOffset -= 1; renderToday(); });
    document.getElementById("next-day").addEventListener("click", () => { viewState.todayDayOffset += 1; renderToday(); });
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

  const filtered = foods.filter((f) => {
    const entry = state.foodTracker[f];
    const tried = entry && entry.status === "tried";
    if (viewState.trackerFilter === "tried" && !tried) return false;
    if (viewState.trackerFilter === "nottried" && tried) return false;
    if (viewState.trackerQuery && !f.toLowerCase().includes(viewState.trackerQuery.toLowerCase())) return false;
    return true;
  });

  const triedCount = foods.filter((f) => state.foodTracker[f]?.status === "tried").length;

  view.innerHTML = `
    <div class="card search-bar">
      <input type="search" id="tracker-search" placeholder="Search foods..." value="${escapeHTML(viewState.trackerQuery)}">
      <div class="reaction-row" style="margin-top:10px;">
        <button class="reaction-btn ${viewState.trackerFilter === "all" ? "selected" : ""}" data-filter="all">All (${foods.length})</button>
        <button class="reaction-btn ${viewState.trackerFilter === "tried" ? "selected" : ""}" data-filter="tried">Tried (${triedCount})</button>
        <button class="reaction-btn ${viewState.trackerFilter === "nottried" ? "selected" : ""}" data-filter="nottried">Not tried (${foods.length - triedCount})</button>
      </div>
    </div>

    <div class="card">
      <h2>Add a food</h2>
      <div style="display:flex; gap:8px;">
        <input type="text" id="custom-food-input" placeholder="e.g. Avocado">
        <button class="btn btn-primary" id="add-custom-food">Add</button>
      </div>
    </div>

    <div class="card">
      <ul class="food-list" id="food-list">
        ${filtered.map((f) => foodRowHTML(f, state)).join("") || '<li class="empty-state">No foods match.</li>'}
      </ul>
    </div>
  `;

  document.getElementById("tracker-search").addEventListener("input", (e) => {
    viewState.trackerQuery = e.target.value;
    renderTracker();
  });
  view.querySelectorAll("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => { viewState.trackerFilter = btn.dataset.filter; renderTracker(); });
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

function foodRowHTML(food, state) {
  const entry = state.foodTracker[food];
  const tried = entry && entry.status === "tried";
  return `
    <li class="food-row-wrap" data-food="${escapeHTML(food)}">
      <div class="food-row">
        <div>
          <div class="food-name">${escapeHTML(food)}</div>
          <div class="food-meta">${tried ? `First tried ${fmtDate(entry.firstDate)}${entry.reaction && entry.reaction !== "none" ? " • " + REACTIONS.find(r => r.key === entry.reaction)?.label : ""}` : "Not tried yet"}</div>
        </div>
        <button class="status-chip ${tried ? "tried" : "not-tried"}" data-toggle="${escapeHTML(food)}">${tried ? "Tried ✓" : "Mark tried"}</button>
      </div>
      ${tried ? `
      <div class="reaction-row">
        ${REACTIONS.map((r) => `<button class="reaction-btn ${entry.reaction === r.key ? "selected" : ""}" data-reaction-food="${escapeHTML(food)}" data-reaction="${r.key}">${r.label}</button>`).join("")}
      </div>
      <textarea class="food-notes" data-notes-food="${escapeHTML(food)}" placeholder="Notes on this food...">${escapeHTML(entry.notes || "")}</textarea>
      ` : ""}
    </li>`;
}

function attachFoodRowHandlers() {
  document.querySelectorAll("[data-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const food = btn.dataset.toggle;
      const entry = store.getFoodEntry(food);
      if (entry && entry.status === "tried") {
        store.unmarkFood(food);
      } else {
        store.markFood(food, { status: "tried", date: todayISO() });
      }
      renderTracker();
    });
  });
  document.querySelectorAll("[data-reaction-food]").forEach((btn) => {
    btn.addEventListener("click", () => {
      store.markFood(btn.dataset.reactionFood, { reaction: btn.dataset.reaction });
      renderTracker();
    });
  });
  document.querySelectorAll(".food-notes").forEach((ta) => {
    ta.addEventListener("blur", () => {
      store.markFood(ta.dataset.notesFood, { notes: ta.value });
    });
  });
}

/* ---------------- Grocery ---------------- */

export function renderGrocery() {
  document.getElementById("day-badge").textContent = "Grocery List";
  const view = document.getElementById("view");
  const state = store.getState();

  if (!state.startDate) {
    view.innerHTML = `<div class="card empty-state"><p>Set your baby's Day 1 date in Settings first.</p></div>`;
    return;
  }

  const baseDay = store.dayNumberFor(todayISO()) + viewState.weekOffset * 7;
  const days = [];
  for (let i = 0; i < 7; i++) {
    const dn = baseDay + i;
    if (dn >= 1 && dn <= 100) days.push(dayData(dn));
  }

  const weekStartISO = store.isoDateForDay(baseDay);
  const weekKey = weekStartISO || `offset-${viewState.weekOffset}`;
  const checks = store.getGroceryChecks(weekKey);

  const byCategory = {};
  days.forEach((d) => {
    d.newFoods.forEach((f) => {
      if (isPantryStaple(f)) return;
      const cat = categoryFor(f);
      byCategory[cat] = byCategory[cat] || new Set();
      byCategory[cat].add(f);
    });
  });

  const rangeLabel = days.length
    ? `${fmtDate(store.isoDateForDay(baseDay))} – ${fmtDate(store.isoDateForDay(baseDay + days.length - 1))}`
    : "Outside the 100-day plan";

  const sections = CATEGORY_ORDER.filter((c) => byCategory[c]?.size).map((cat) => {
    const items = Array.from(byCategory[cat]).sort((a, b) => a.localeCompare(b));
    return `
      <div class="grocery-category">
        <h3>${cat}</h3>
        ${items.map((item) => `
          <label class="grocery-item ${checks[item] ? "checked" : ""}">
            <input type="checkbox" data-grocery-item="${escapeHTML(item)}" ${checks[item] ? "checked" : ""}>
            <span>${escapeHTML(item)}</span>
          </label>`).join("")}
      </div>`;
  }).join("");

  const mealsPreview = days.map((d) => `
    <div class="food-meta" style="margin-bottom:4px;">
      <strong>Day ${d.day}:</strong> ${escapeHTML(d.meals.join(", "))}${d.familyMeal ? " · Family: " + escapeHTML(d.familyMeal) : ""}
    </div>`).join("");

  view.innerHTML = `
    <div class="day-nav">
      <button id="prev-week">‹</button>
      <span class="current-date">${rangeLabel}</span>
      <button id="next-week">›</button>
    </div>

    <div class="card">
      <h2>🛒 Shopping checklist</h2>
      <p class="hint">New foods introduced this week, grouped by aisle. Pantry staples (spices, oils, vinegar) are left out; full ingredient lists are in each day's recipe on the Today tab.</p>
      ${sections || '<p class="empty-state">No new ingredients this week.</p>'}
    </div>

    <div class="card">
      <h2>This week's menu</h2>
      ${mealsPreview || '<p class="empty-state">Nothing planned.</p>'}
    </div>
  `;

  document.getElementById("prev-week").addEventListener("click", () => { viewState.weekOffset -= 1; renderGrocery(); });
  document.getElementById("next-week").addEventListener("click", () => { viewState.weekOffset += 1; renderGrocery(); });

  view.querySelectorAll("[data-grocery-item]").forEach((cb) => {
    cb.addEventListener("change", () => {
      const current = store.getGroceryChecks(weekKey);
      current[cb.dataset.groceryItem] = cb.checked;
      store.setGroceryChecks(weekKey, current);
      renderGrocery();
    });
  });
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
