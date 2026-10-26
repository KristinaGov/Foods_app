// Local persistence layer. Everything lives in localStorage under one key so
// export/import is a single JSON blob the user can commit to their GitHub repo.
const STORAGE_KEY = "babyFoodPlan.v1";

const DEFAULT_STATE = {
  updatedAt: null, // ISO timestamp of the last change; used to pick the newest copy when syncing
  startDate: null, // ISO date string "YYYY-MM-DD", set on first launch
  // foodName -> { status: "tried", firstDate, reaction, notes, timesServed,
  //               tries: [{ date: "YYYY-MM-DD", reaction }] }
  // firstDate / reaction (latest) / timesServed are derived from tries.
  foodTracker: {},
  // ISO date -> { day, notes, reaction, customFoods: [] }
  dailyLogs: {},
  // persists which grocery items have been checked off, keyed by week start ISO date
  groceryChecks: {}
};

// Keeps the derived summary fields of a food entry in step with its tries.
function recompute(entry) {
  entry.tries = (entry.tries || []).slice().sort((a, b) => a.date.localeCompare(b.date));
  if (entry.tries.length) {
    entry.status = "tried";
    entry.firstDate = entry.tries[0].date;
    entry.reaction = entry.tries[entry.tries.length - 1].reaction || "none";
    entry.timesServed = entry.tries.length;
  }
  return entry;
}

// Entries written before try history existed get one try from their
// firstDate and overall reaction.
function migrate(state) {
  Object.values(state.foodTracker).forEach((e) => {
    if (e.status === "tried" && !(e.tries && e.tries.length)) {
      e.tries = [{ date: e.firstDate || new Date().toISOString().slice(0, 10), reaction: e.reaction || "none" }];
    }
    recompute(e);
  });
  return state;
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return migrate({ ...structuredClone(DEFAULT_STATE), ...parsed });
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

  // Marks a food as tried (adding a first try on `date` if it has none) and/or
  // updates its notes. Reactions live on individual tries; see addTry/updateTry.
  markFood(foodName, { status, reaction, notes, date } = {}) {
    const existing = state.foodTracker[foodName] || { timesServed: 0, notes: "", tries: [] };
    existing.tries = existing.tries || [];
    if (notes !== undefined) existing.notes = notes;
    if ((status === "tried" || !existing.tries.length) && !existing.tries.length) {
      existing.tries.push({ date: date ?? new Date().toISOString().slice(0, 10), reaction: reaction ?? "none" });
    } else if (reaction !== undefined && existing.tries.length) {
      existing.tries[existing.tries.length - 1].reaction = reaction;
    }
    state.foodTracker[foodName] = recompute(existing);
    save();
  },

  addTry(foodName, { date, reaction = "none" } = {}) {
    const existing = state.foodTracker[foodName] || { timesServed: 0, notes: "", tries: [] };
    existing.tries = existing.tries || [];
    existing.tries.push({ date: date ?? new Date().toISOString().slice(0, 10), reaction });
    state.foodTracker[foodName] = recompute(existing);
    save();
  },

  updateTry(foodName, index, patch) {
    const entry = state.foodTracker[foodName];
    if (!entry || !entry.tries || !entry.tries[index]) return;
    entry.tries[index] = { ...entry.tries[index], ...patch };
    recompute(entry);
    save();
  },

  // Removes one try; the food goes back to "not tried" when none are left.
  removeTry(foodName, index) {
    const entry = state.foodTracker[foodName];
    if (!entry || !entry.tries) return;
    entry.tries.splice(index, 1);
    if (!entry.tries.length) delete state.foodTracker[foodName];
    else recompute(entry);
    save();
  },

  tryIndexOn(foodName, isoDate) {
    const entry = state.foodTracker[foodName];
    if (!entry || !entry.tries) return -1;
    return entry.tries.findIndex((t) => t.date === isoDate);
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
    state = migrate({ ...structuredClone(DEFAULT_STATE), ...parsed });
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
