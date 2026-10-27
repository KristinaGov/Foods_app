import { store } from "../store.js";
import { PLAN, GROCERIES, viewState, fmtDate, escapeHTML, currentWeekNumber } from "./shared.js";

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
