// Local persistence layer. Everything lives in localStorage under one key so
// export/import is a single JSON blob the user can commit to their GitHub repo.
const STORAGE_KEY = "babyFoodPlan.v1";

const DEFAULT_STATE = {
  updatedAt: null, // ISO timestamp of the last change; used to pick the newest copy when syncing
  startDate: null, // ISO date string "YYYY-MM-DD", set on first launch
  // foodName -> { status: "tried", firstDate, reaction, notes, timesServed }
  foodTracker: {},
  // ISO date -> { day, notes, reaction, customFoods: [] }
  dailyLogs: {},
  // persists which grocery items have been checked off, keyed by week start ISO date
  groceryChecks: {}
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(DEFAULT_STATE), ...parsed };
  } catch (e) {
    console.error("Failed to load state, resetting.", e);
    return structuredClone(DEFAULT_STATE);
  }
}

let state = load();
const listeners = [];

// touch=false keeps the existing updatedAt (used when restoring a backup so
// the restored copy is not mistaken for a newer edit).
function save(touch = true) {
  if (touch) state.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  listeners.forEach((fn) => { try { fn(state); } catch (e) { console.error(e); } });
}

export const store = {
  getState() {
    return state;
  },

  onChange(fn) {
    listeners.push(fn);
  },

  hasUserData() {
    return Object.keys(state.foodTracker).length > 0 || Object.keys(state.dailyLogs).length > 0 || Boolean(state.startDate);
  },

  setStartDate(isoDate) {
    state.startDate = isoDate;
    save();
  },

  // Day number (1-based) for a given ISO date, or null if start date not set.
  dayNumberFor(isoDate) {
    if (!state.startDate) return null;
    const start = new Date(state.startDate + "T00:00:00");
    const target = new Date(isoDate + "T00:00:00");
    const diffDays = Math.round((target - start) / 86400000);
    return diffDays + 1;
  },

  isoDateForDay(dayNumber) {
    if (!state.startDate) return null;
    const d = new Date(state.startDate + "T00:00:00");
    d.setDate(d.getDate() + (dayNumber - 1));
    // Format in local time. toISOString() would convert to UTC and, in any
    // timezone ahead of UTC, shift local midnight back to the previous day.
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  },

  markFood(foodName, { status, reaction, notes, date } = {}) {
    const existing = state.foodTracker[foodName] || { timesServed: 0 };
    const wasTried = existing.status === "tried";
    state.foodTracker[foodName] = {
      ...existing,
      status: status ?? existing.status ?? "tried",
      firstDate: existing.firstDate ?? date ?? new Date().toISOString().slice(0, 10),
      reaction: reaction ?? existing.reaction ?? "none",
      notes: notes ?? existing.notes ?? "",
      timesServed: (existing.timesServed || 0) + (wasTried ? 0 : 1)
    };
    save();
  },

  unmarkFood(foodName) {
    delete state.foodTracker[foodName];
    save();
  },

  getFoodEntry(foodName) {
    return state.foodTracker[foodName] || null;
  },

  setDailyLog(isoDate, patch) {
    const existing = state.dailyLogs[isoDate] || { customFoods: [] };
    state.dailyLogs[isoDate] = { ...existing, ...patch };
    save();
  },

  getDailyLog(isoDate) {
    return state.dailyLogs[isoDate] || null;
  },

  setGroceryChecks(weekKey, checks) {
    state.groceryChecks[weekKey] = checks;
    save();
  },

  getGroceryChecks(weekKey) {
    return state.groceryChecks[weekKey] || {};
  },

  exportJSON() {
    return JSON.stringify(state, null, 2);
  },

  importJSON(json) {
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) || !("foodTracker" in parsed)) {
      throw new Error("this is not a Baby Food Plan backup");
    }
    state = { ...structuredClone(DEFAULT_STATE), ...parsed };
    save(!parsed.updatedAt);
  }
};

export async function loadPlan() {
  const res = await fetch("./data/plan.json");
  if (!res.ok) throw new Error("Could not load plan data");
  return res.json();
}

export async function loadWeeks() {
  const res = await fetch("./data/weeks.json");
  if (!res.ok) throw new Error("Could not load week overview data");
  return res.json();
}
