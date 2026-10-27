import { store } from "../store.js";
import { allergenFor, ALLERGEN_ORDER, foodsInIngredients } from "../categories.js";
import { viewState, dayData, todayISO, fmtDate, escapeHTML, recipeCardHTML, backupNoticeHTML, attachBackupNotice, REACTIONS, allKnownFoods } from "./shared.js";

/* ---------------- Today ---------------- */

const ALLERGEN_REPEAT_DAYS = 7;

// For every allergen group that has been introduced (any try logged), how
// many days since it was last served as of `iso`. The plan asks for each
// introduced allergen to be repeated at least twice a week.
function allergenExposure(iso) {
  const tracker = store.getState().foodTracker;
  const last = {};
  Object.entries(tracker).forEach(([food, entry]) => {
    const group = allergenFor(food);
    if (!group || !entry.tries) return;
    entry.tries.forEach((t) => {
      if (t.date <= iso && (!last[group] || t.date > last[group])) last[group] = t.date;
    });
  });
  const ref = new Date(iso + "T00:00:00");
  return ALLERGEN_ORDER.filter((g) => last[g]).map((g) => {
    const days = Math.round((ref - new Date(last[g] + "T00:00:00")) / 86400000);
    return { group: g, last: last[g], days, due: days >= ALLERGEN_REPEAT_DAYS };
  }).sort((a, b) => b.days - a.days);
}

function allergenCheckHTML(iso) {
  const rows = allergenExposure(iso);
  if (!rows.length) return "";
  const due = rows.filter((r) => r.due).length;
  return `
    <div class="card">
      <h2>🔁 Allergen check${due ? ` <span class="chip-count status-err">${due} due</span>` : ""}</h2>
      <p class="hint">Introduced allergens should be served at least twice a week. Days since each was last logged:</p>
      <ul class="food-list">
        ${rows.map((r) => `
        <li class="exposure-row ${r.due ? "due" : ""}">
          <span class="exposure-name">${r.due ? "⚠" : "✓"} ${escapeHTML(r.group)}</span>
          <span class="food-meta">${r.days === 0 ? "today" : r.days === 1 ? "yesterday" : `${r.days} days ago`}${r.due ? " · serve again" : ""}</span>
        </li>`).join("")}
      </ul>
    </div>`;
}

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

  const pillHTML = (f) => {
    const triedToday = store.tryIndexOn(f, iso) >= 0;
    const triedBefore = !triedToday && store.getFoodEntry(f)?.status === "tried";
    return `<button class="pill ${triedToday ? "" : "outline"} new-food-pill" data-food="${escapeHTML(f)}">${triedToday ? "✓ " : triedBefore ? "↻ " : ""}${escapeHTML(f)}</button>`;
  };
  const newFoodsHTML = data.newFoods.map(pillHTML).join("");
  // Tracker foods that appear in today's recipes but are not new today: the
  // plan asks for repeat exposure (allergens at least twice a week), so these
  // can be logged with one tap too.
  const ingredientLines = (data.recipes || []).flatMap((r) => r.ingredients || []);
  const repeatFoods = foodsInIngredients(ingredientLines, allKnownFoods())
    .filter((f) => !data.newFoods.includes(f))
    .sort((a, b) => (allergenFor(b) ? 1 : 0) - (allergenFor(a) ? 1 : 0) || a.localeCompare(b));
  const repeatFoodsHTML = repeatFoods.map(pillHTML).join("");
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

  // Remember which recipes are expanded so re-rendering (after a pill or
  // reaction tap) does not fold them shut.
  if (viewState.openRecipes.day === dayNumber) {
    viewState.openRecipes.idx = Array.from(view.querySelectorAll("details")).map((d, i) => (d.open ? i : -1)).filter((i) => i >= 0);
  } else {
    viewState.openRecipes = { day: dayNumber, idx: [] };
  }

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

    ${repeatFoods.length ? `
    <div class="card">
      <h2>🔁 Also in today's recipes</h2>
      <p class="hint">Foods you have tried before (↻) or could log again today. Allergens first.</p>
      <div>${repeatFoodsHTML}</div>
    </div>` : ""}

    ${allergensHTML ? `
    <div class="card">
      <h2>⚠️ Allergens introduced</h2>
      <div>${allergensHTML}</div>
    </div>` : ""}

    ${allergenCheckHTML(iso)}

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
  const detailsEls = view.querySelectorAll("details");
  viewState.openRecipes.idx.forEach((i) => { if (detailsEls[i]) detailsEls[i].open = true; });

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
