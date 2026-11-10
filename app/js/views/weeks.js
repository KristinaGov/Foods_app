import { store, addDaysISO } from "../store.js";
import { PLAN, WEEKS, viewState, todayISO, fmtDate, escapeHTML, LAST_WEEK, currentWeekNumber, weekNumberFor } from "./shared.js";

/* ---------------- Weekly overview ---------------- */

const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

// Number of food tries logged per ISO date.
function triesByDate() {
  const counts = {};
  Object.values(store.getState().foodTracker).forEach((entry) => {
    (entry.tries || []).forEach((t) => { counts[t.date] = (counts[t.date] || 0) + 1; });
  });
  return counts;
}

// GitHub-style calendar: one square per calendar date from Day 1 to the
// last plan day, seven per row starting on Day 1's weekday. Squares show
// the plan day number and darken with the amount logged that day; skipped
// dates are striped amber and carry no day number, so the shift of the plan
// is visible. The week currently shown is ringed; tapping a square shows
// its week.
function calendarHTML(week) {
  const state = store.getState();
  if (!state.startDate) return "";
  const today = todayISO();
  const lastISO = store.isoDateForDay(100);
  const tries = triesByDate();
  const cells = [];
  for (let iso = state.startDate; iso <= lastISO; iso = addDaysISO(iso, 1)) {
    const skipped = store.isSkipped(iso);
    const day = store.dayNumberFor(iso);
    const w = weekNumberFor(skipped ? store.upcomingDayNumber(iso) : day);
    const log = state.dailyLogs[iso] || {};
    const activity = (tries[iso] || 0) + (log.notes || (log.reaction && log.reaction !== "none") ? 1 : 0);
    let level = "t0";
    if (skipped) level = "skipped";
    else if (iso > today) level = "future";
    else if (activity >= 4) level = "t3";
    else if (activity >= 2) level = "t2";
    else if (activity >= 1) level = "t1";
    const classes = ["cal-cell", level, w === week ? "in-week" : "", iso === today ? "today" : ""].filter(Boolean).join(" ");
    const title = skipped ? `${fmtDate(iso)} · skipped` : `${fmtDate(iso)} · Day ${day}${activity ? ` · ${activity} logged` : ""}`;
    cells.push({ iso, day, w, skipped, html: `<button class="${classes}" data-cal-week="${w}" title="${escapeHTML(title)}" aria-label="${escapeHTML(title)}">${skipped ? "⏭" : day}</button>` });
  }
  const rows = [];
  for (let i = 0; i < cells.length; i += 7) {
    const chunk = cells.slice(i, i + 7);
    const first = chunk.find((c) => !c.skipped) || chunk[0];
    const label = `<span class="cal-label ${first.w === week ? "in-week" : ""}" title="${fmtDate(chunk[0].iso)}">W${first.w}</span>`;
    rows.push(label + chunk.map((c) => c.html).join("") + "<span></span>".repeat(7 - chunk.length));
  }
  const startDow = new Date(state.startDate + "T00:00:00").getDay();
  const header = `<span></span>${Array.from({ length: 7 }, (_, i) => `<span class="cal-dow">${WEEKDAY_INITIALS[(startDow + i) % 7]}</span>`).join("")}`;
  const skippedCount = state.skippedDays.filter((s) => s >= state.startDate && s <= lastISO).length;
  return `
    <div class="card cal-card">
      <div class="activity-head">
        <h2>100 days at a glance</h2>
        <span class="food-meta">${skippedCount ? `${skippedCount} skipped · ` : ""}ends ${new Date(lastISO + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
      </div>
      <div class="cal-grid" id="cal-grid">${header}${rows.join("")}</div>
      <div class="cal-legend">
        <span><i class="cal-cell t0"></i> nothing logged</span>
        <span><i class="cal-cell t1"></i><i class="cal-cell t2"></i><i class="cal-cell t3"></i> logged</span>
        <span><i class="cal-cell skipped"></i> skipped</span>
        <span><i class="cal-cell future today"></i> today</span>
      </div>
    </div>`;
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

  const state = store.getState();
  const hasDates = Boolean(state.startDate);
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

  // Skipped dates belong to the week of the plan day that follows them, so
  // they are listed in place between the days they pushed apart.
  const skippedInWeek = hasDates
    ? state.skippedDays.filter((s) => s >= state.startDate && weekNumberFor(store.upcomingDayNumber(s)) === week && store.upcomingDayNumber(s) <= 100)
    : [];
  const rows = [];
  days.forEach((d) => {
    const iso = hasDates ? store.isoDateForDay(d.day) : null;
    skippedInWeek.filter((s) => s < iso).forEach((s) => {
      if (!rows.some((r) => r.iso === s)) rows.push({ iso: s, html: `
      <div class="week-day-row skipped-row">
        <div class="food-name">⏭ Skipped · ${fmtDate(s)}</div>
        <div class="food-meta">${escapeHTML(state.dailyLogs[s]?.notes || "No solids this day; the plan shifted by one day.")}</div>
      </div>` });
    });
    rows.push({ iso, html: `
      <div class="week-day-row">
        <div class="food-name">Day ${d.day}${iso ? ` · ${fmtDate(iso)}` : ""}</div>
        <div class="food-meta">${escapeHTML(d.meals.join(", "))}${d.familyMeal ? ` · <em>Family: ${escapeHTML(d.familyMeal)}</em>` : ""}</div>
        ${d.newFoods.length ? `<div class="food-meta">New: ${escapeHTML(d.newFoods.join(", "))}</div>` : ""}
      </div>` });
  });
  const dayRows = rows.map((r) => r.html).join("");

  view.innerHTML = `
    <div class="day-nav">
      <button id="prev-week-ov" ${week <= 1 ? "disabled" : ""}>‹</button>
      <span class="current-date">Week ${week}${rangeLabel ? " · " + rangeLabel : ""}</span>
      <button id="next-week-ov" ${week >= LAST_WEEK ? "disabled" : ""}>›</button>
    </div>

    ${calendarHTML(week)}

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
  view.querySelectorAll("[data-cal-week]").forEach((btn) => {
    btn.addEventListener("click", () => {
      viewState.overviewWeek = Number(btn.dataset.calWeek);
      renderWeeks();
      document.getElementById("cal-grid")?.scrollIntoView({ block: "nearest" });
    });
  });
}
