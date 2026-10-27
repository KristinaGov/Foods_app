import { store } from "../store.js";
import { iconFor, allergenFor } from "../categories.js";
import { viewState, fmtDate, escapeHTML, reactionLabel } from "./shared.js";

/* ---------------- Notes: timeline ---------------- */

// One dated log across everything: daily reactions and notes, every food
// try with its reaction, and food notes (shown under the food's latest try).
function timelineEntries() {
  const state = store.getState();
  const byDate = {};
  const at = (iso) => (byDate[iso] = byDate[iso] || { iso, day: null, reaction: null, notes: "", tries: [] });
  Object.entries(state.dailyLogs).forEach(([iso, log]) => {
    if (!log.notes && (!log.reaction || log.reaction === "none")) return;
    const e = at(iso);
    e.day = log.day ?? null;
    e.reaction = log.reaction && log.reaction !== "none" ? log.reaction : null;
    e.notes = log.notes || "";
  });
  Object.entries(state.foodTracker).forEach(([food, entry]) => {
    const tries = entry.tries || [];
    tries.forEach((t, i) => {
      at(t.date).tries.push({ food, reaction: t.reaction && t.reaction !== "none" ? t.reaction : null,
                              note: i === tries.length - 1 ? (entry.notes || "") : "", first: i === 0 });
    });
  });
  return Object.values(byDate).sort((a, b) => b.iso.localeCompare(a.iso));
}

export function renderNotes() {
  document.getElementById("day-badge").textContent = "Timeline";
  const view = document.getElementById("view");
  const filter = viewState.notesFilter;
  const entries = timelineEntries().map((e) => {
    const tries = e.tries.filter((t) => filter === "all" || (filter === "reactions" && t.reaction) || (filter === "notes" && t.note));
    const keepDay = filter === "all" || (filter === "reactions" && e.reaction) || (filter === "notes" && e.notes);
    return { ...e, tries, keepDay };
  }).filter((e) => e.tries.length || e.keepDay);

  const chips = `
    <div class="card search-bar">
      <div class="reaction-row">
        ${[["all", "Everything"], ["reactions", "Reactions"], ["notes", "Notes"]].map(([k, label]) =>
          `<button class="reaction-btn ${filter === k ? "selected" : ""}" data-notes-filter="${k}">${label}</button>`).join("")}
      </div>
    </div>`;

  view.innerHTML = chips + (entries.map((e) => {
    const dayNo = e.day ?? store.dayNumberFor(e.iso);
    return `
    <div class="card">
      <h2>${dayNo ? `Day ${dayNo} · ` : ""}${fmtDate(e.iso)}</h2>
      ${e.keepDay && (e.reaction || e.notes) ? `
      <div class="timeline-day">
        ${e.reaction ? `<span class="pill outline">${reactionLabel(e.reaction)}</span>` : ""}
        ${e.notes ? `<p class="timeline-note">${escapeHTML(e.notes)}</p>` : ""}
      </div>` : ""}
      ${e.tries.length ? `
      <ul class="food-list">
        ${e.tries.map((t) => `
        <li class="timeline-try">
          <span class="food-icon" aria-hidden="true">${iconFor(t.food)}</span>
          <div class="food-row-text">
            <div class="food-name">${escapeHTML(t.food)}${t.first ? ' <span class="chip-count">first try</span>' : ""}${allergenFor(t.food) ? ` <span class="allergen-badge">⚠ ${escapeHTML(allergenFor(t.food))}</span>` : ""}</div>
            ${t.reaction ? `<div class="food-meta">${reactionLabel(t.reaction)}</div>` : ""}
            ${t.note ? `<div class="timeline-note food-meta">“${escapeHTML(t.note)}”</div>` : ""}
          </div>
        </li>`).join("")}
      </ul>` : ""}
    </div>`;
  }).join("") || '<div class="card empty-state"><p>Nothing logged yet. Tries, reactions and notes from the Today and Tracker tabs show up here.</p></div>');

  view.querySelectorAll("[data-notes-filter]").forEach((btn) => {
    btn.addEventListener("click", () => { viewState.notesFilter = btn.dataset.notesFilter; renderNotes(); });
  });
}
