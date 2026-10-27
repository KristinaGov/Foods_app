import { store } from "../store.js";
import { PLAN, WEEKS, viewState, fmtDate, escapeHTML, LAST_WEEK, currentWeekNumber } from "./shared.js";

/* ---------------- Weekly overview ---------------- */

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
