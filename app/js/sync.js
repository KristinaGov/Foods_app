// GitHub backup: mirrors the whole app state into one secret Gist in the
// user's own GitHub account. A secret Gist is unlisted (not searchable) but
// readable by anyone who has its URL, so this is a backup/sync channel, not
// a vault. The token and gist id are kept in their own localStorage key so
// they are never part of an exported backup file.
import { store } from "./store.js";

const SYNC_KEY = "babyFoodPlan.sync.v1";
const FILE_NAME = "baby-food-plan.json";
const GIST_DESCRIPTION = "Baby Food Plan - tracker backup (written by the app)";
const API = "https://api.github.com";
const DEBOUNCE_MS = 2500;

const DEFAULT_CONFIG = { token: "", gistId: "", login: "", lastSyncAt: null, lastError: "", lastExportAt: null };

function loadConfig() {
  try {
    return { ...DEFAULT_CONFIG, ...JSON.parse(localStorage.getItem(SYNC_KEY) || "{}") };
  } catch (e) {
    return { ...DEFAULT_CONFIG };
  }
}

let config = loadConfig();
let timer = null;
const listeners = [];

function saveConfig(patch) {
  config = { ...config, ...patch };
  try { localStorage.setItem(SYNC_KEY, JSON.stringify(config)); } catch (e) { console.error(e); }
  listeners.forEach((fn) => { try { fn(config); } catch (e) { console.error(e); } });
}

async function api(path, { method = "GET", body, token = config.token } = {}) {
  const res = await fetch(API + path, {
    method,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    let msg = `GitHub error ${res.status}`;
    try { msg += ": " + (await res.json()).message; } catch (e) { /* no body */ }
    if (res.status === 401) msg = "GitHub rejected the token (401). Check it has the 'gist' scope and has not expired.";
    throw new Error(msg);
  }
  return res.status === 204 ? null : res.json();
}

// Returns the parsed backup object stored in the gist, or null if none/invalid.
async function readGist(gistId, token) {
  const gist = await api(`/gists/${gistId}`, { token });
  const file = gist.files && gist.files[FILE_NAME];
  if (!file) return null;
  let content = file.content;
  if (file.truncated) content = await (await fetch(file.raw_url, { cache: "no-store" })).text();
  try {
    const parsed = JSON.parse(content);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch (e) {
    return null;
  }
}

export function hasUserData(state) {
  return Boolean(state) && (
    Object.keys(state.foodTracker || {}).length > 0 ||
    Object.keys(state.dailyLogs || {}).length > 0 ||
    Boolean(state.startDate)
  );
}

export const sync = {
  getConfig() { return config; },
  onStatus(fn) { listeners.push(fn); },
  isConnected() { return Boolean(config.token && config.gistId); },
  markExported() { saveConfig({ lastExportAt: new Date().toISOString() }); },

  // Validates the token, then finds the existing backup gist or creates one.
  // Returns { login, remote, created } where remote is the parsed backup
  // already on GitHub (null if the gist was just created).
  async connect(rawToken) {
    const token = (rawToken || "").trim();
    if (!token) throw new Error("Paste a token first.");
    const user = await api("/user", { token });
    let gistId = "";
    for (let page = 1; page <= 5 && !gistId; page++) {
      const gists = await api(`/gists?per_page=100&page=${page}`, { token });
      const hit = gists.find((g) => g.files && g.files[FILE_NAME]);
      if (hit) gistId = hit.id;
      if (gists.length < 100) break;
    }
    let remote = null;
    let created = false;
    if (gistId) {
      remote = await readGist(gistId, token);
    } else {
      const made = await api("/gists", {
        method: "POST", token,
        body: { description: GIST_DESCRIPTION, public: false, files: { [FILE_NAME]: { content: store.exportJSON() } } }
      });
      gistId = made.id;
      created = true;
    }
    saveConfig({ token, gistId, login: user.login, lastError: "", lastSyncAt: created ? new Date().toISOString() : null });
    return { login: user.login, remote, created };
  },

  disconnect() {
    clearTimeout(timer);
    saveConfig({ token: "", gistId: "", login: "", lastError: "", lastSyncAt: null });
  },

  // Called on every store change; coalesces bursts of edits into one upload.
  scheduleSync() {
    if (!this.isConnected()) return;
    clearTimeout(timer);
    timer = setTimeout(() => { this.push().catch((e) => console.error("Backup failed", e)); }, DEBOUNCE_MS);
  },

  async push() {
    if (!this.isConnected()) return;
    try {
      await api(`/gists/${config.gistId}`, { method: "PATCH", body: { files: { [FILE_NAME]: { content: store.exportJSON() } } } });
      saveConfig({ lastSyncAt: new Date().toISOString(), lastError: "" });
    } catch (e) {
      saveConfig({ lastError: e.message });
      throw e;
    }
  },

  async pull() {
    if (!this.isConnected()) return null;
    try {
      const remote = await readGist(config.gistId, config.token);
      saveConfig({ lastError: "" });
      return remote;
    } catch (e) {
      saveConfig({ lastError: e.message });
      throw e;
    }
  },

  // Two-device reconciliation on launch/foreground: newest copy wins.
  // Returns "pulled", "pushed", "in-sync" or "offline".
  async syncOnStart() {
    if (!this.isConnected()) return "in-sync";
    if (navigator.onLine === false) return "offline";
    const remote = await this.pull();
    const local = store.getState();
    const remoteAt = remote && remote.updatedAt ? remote.updatedAt : "";
    const localAt = local.updatedAt || "";
    if (hasUserData(remote) && remoteAt > localAt) {
      store.importJSON(JSON.stringify(remote));
      return "pulled";
    }
    if (localAt > remoteAt) {
      await this.push();
      return "pushed";
    }
    return "in-sync";
  }
};
