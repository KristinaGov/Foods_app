// Shared state and helpers for the tab views (views/*.js). The plan data is
// loaded once by app.js and set here; viewState holds UI state that should
// survive re-renders (current day offset, filters, open editors).
import { store } from "../store.js";
import { sync } from "../sync.js";

const BACKUP_REMINDER_DAYS = 14;

// Shown on Today when data exists on this phone only and no export was made
// recently. Disappears once GitHub backup is connected or a file is exported.
export function backupNoticeHTML() {
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

export function attachBackupNotice() {
  const btn = document.getElementById("notice-open-settings");
  if (btn) btn.addEventListener("click", () => document.getElementById("settings-btn").click());
}

export let PLAN = [];
export let WEEKS = [];
export let GROCERIES = {};
// editingNotesFor: ISO date whose notes textarea is open (null = none).
// editingFoodNote: food name whose Tracker note textarea is open.
// overviewWeek / groceryWeek: plan week shown on the Weeks / Grocery tab (null = current week).
export const viewState = { todayDayOffset: 0, trackerFilter: "all", trackerQuery: "", trackerCategory: "all", trackerAllergens: false, editingNotesFor: null, editingFoodNote: null, overviewWeek: null, groceryWeek: null, notesFilter: "all", openRecipes: { day: null, idx: [] } };

export function setPlan(plan) {
  PLAN = plan;
}

export function setWeeks(weeks) {
  WEEKS = weeks;
}

export function setGroceries(groceries) {
  GROCERIES = groceries;
}

export function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function fmtDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function dayData(dayNumber) {
  return PLAN.find((d) => d.day === dayNumber) || null;
}

export function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function stepsHTML(instructions) {
  // Instructions are either "1. ... 2. ..." numbered steps, or a plain paragraph
  // of "Prepare the X. ..." sentences; render numbered steps as a list either way.
  const numbered = instructions.match(/\d+\.\s/) ;
  const parts = numbered
    ? instructions.split(/(?=\d+\.\s)/).map((s) => s.replace(/^\d+\.\s*/, "").trim()).filter(Boolean)
    : instructions.split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
  return `<ol class="food-list">${parts.map((s) => `<li>${escapeHTML(s)}</li>`).join("")}</ol>`;
}

export function recipeCardHTML(rec) {
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

export const REACTIONS = [
  { key: "none", label: "No reaction" },
  { key: "liked", label: "😋 Liked it" },
  { key: "neutral", label: "😐 Neutral" },
  { key: "disliked", label: "😖 Disliked" },
  { key: "rash", label: "🔴 Rash/allergy" }
];

export function reactionLabel(key) {
  return REACTIONS.find((r) => r.key === key)?.label || key;
}


export function allKnownFoods() {
  const all = new Set();
  PLAN.forEach((d) => d.newFoods.forEach((f) => all.add(f)));
  const state = store.getState();
  (state.customFoods || []).forEach((f) => all.add(f));
  Object.keys(state.foodTracker).forEach((f) => all.add(f));
  return Array.from(all).sort((a, b) => a.localeCompare(b));
}

// The list part of the Tracker (category cards). Split out so typing in the

export const LAST_WEEK = 15;

export function weekNumberFor(dayNumber) {
  return Math.min(LAST_WEEK, Math.max(1, Math.ceil(dayNumber / 7)));
}

export function currentWeekNumber() {
  const baseDay = store.dayNumberFor(todayISO());
  return baseDay === null ? 1 : weekNumberFor(baseDay);
}

