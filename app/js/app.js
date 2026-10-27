import { store, loadPlan, loadWeeks, loadGroceries } from "./store.js";
import { sync, hasUserData } from "./sync.js";
import { THEMES, getTheme, setTheme, applyTheme } from "./theme.js";
import { setPlan, setWeeks, setGroceries, renderToday, renderTracker, renderGrocery, renderWeeks, renderNotes } from "./views.js";

// Bump together with CACHE_NAME in service-worker.js on every deploy. Settings
// compares the two so a worker serving stale files is visible.
const APP_VERSION = "v14";

const renderers = { today: renderToday, tracker: renderTracker, grocery: renderGrocery, weeks: renderWeeks, notes: renderNotes };
let currentTab = "today";

function renderCurrentTab() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === currentTab);
  });
  renderers[currentTab]();
}

function setupTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentTab = btn.dataset.tab;
      renderCurrentTab();
    });
  });
}

function fmtDateTime(iso) {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function renderSyncStatus() {
  const cfg = sync.getConfig();
  const connected = sync.isConnected();
  document.getElementById("github-disconnected").classList.toggle("hidden", connected);
  document.getElementById("github-connected").classList.toggle("hidden", !connected);
  document.getElementById("last-export").textContent = cfg.lastExportAt ? `Last export: ${fmtDateTime(cfg.lastExportAt)}.` : "No export yet.";
  if (!connected) return;
  const el = document.getElementById("github-status");
  if (cfg.lastError) {
    el.textContent = `⚠️ Connected as ${cfg.login}, but the last backup failed: ${cfg.lastError}`;
    el.className = "hint status-err";
  } else {
    el.textContent = `✓ Connected as ${cfg.login} · ${cfg.lastSyncAt ? "last backup " + fmtDateTime(cfg.lastSyncAt) : "not backed up yet"}`;
    el.className = "hint status-ok";
  }
}

// After connecting: decide whether GitHub's copy or this phone's copy wins.
async function reconcileAfterConnect(remote) {
  if (!hasUserData(remote)) { await sync.push(); return; }
  if (!store.hasUserData()) {
    store.importJSON(JSON.stringify(remote));
    alert("Your data was restored from GitHub.");
    return;
  }
  if (remote.updatedAt && remote.updatedAt === store.getState().updatedAt) return;
  const when = remote.updatedAt ? fmtDateTime(remote.updatedAt) : "an unknown date";
  const useRemote = confirm(`A backup from ${when} exists on GitHub.\n\nOK = replace the data on this phone with that backup.\nCancel = keep this phone's data and overwrite the GitHub backup.`);
  if (useRemote) store.importJSON(JSON.stringify(remote));
  else await sync.push();
}

function renderThemePicker() {
  const row = document.getElementById("theme-row");
  const current = getTheme();
  row.innerHTML = THEMES.map((t) => `
    <button class="theme-swatch ${t.key === current ? "selected" : ""}" data-theme-key="${t.key}" aria-pressed="${t.key === current}">
      <span class="dot" style="background:${t.swatch};"></span>${t.label}
    </button>`).join("");
  row.querySelectorAll("[data-theme-key]").forEach((btn) => {
    btn.addEventListener("click", () => { setTheme(btn.dataset.themeKey); renderThemePicker(); });
  });
}

function setupSettings() {
  const modal = document.getElementById("settings-modal");
  applyTheme(getTheme());
  renderThemePicker();
  const startDateInput = document.getElementById("start-date-input");
  const state = store.getState();
  if (state.startDate) startDateInput.value = state.startDate;

  document.getElementById("settings-btn").addEventListener("click", () => {
    renderSyncStatus();
    modal.classList.remove("hidden");
  });
  document.getElementById("close-settings").addEventListener("click", () => {
    modal.classList.add("hidden");
    renderCurrentTab();
  });
  startDateInput.addEventListener("change", () => {
    store.setStartDate(startDateInput.value);
    renderCurrentTab();
  });

  document.getElementById("export-btn").addEventListener("click", () => {
    const blob = new Blob([store.exportJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `baby-food-plan-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    sync.markExported();
    renderSyncStatus();
  });

  document.getElementById("import-file").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      store.importJSON(text);
      startDateInput.value = store.getState().startDate || "";
      renderCurrentTab();
      alert("Data imported.");
    } catch (err) {
      alert("Could not import that file: " + err.message);
    }
    e.target.value = "";
  });

  const tokenInput = document.getElementById("github-token");
  const connectBtn = document.getElementById("github-connect");
  connectBtn.addEventListener("click", async () => {
    connectBtn.disabled = true;
    connectBtn.textContent = "Connecting…";
    try {
      const { remote } = await sync.connect(tokenInput.value);
      tokenInput.value = "";
      await reconcileAfterConnect(remote);
      startDateInput.value = store.getState().startDate || "";
    } catch (err) {
      alert("Could not connect: " + err.message);
    } finally {
      connectBtn.disabled = false;
      connectBtn.textContent = "Connect";
      renderSyncStatus();
    }
  });

  document.getElementById("github-push").addEventListener("click", async () => {
    try { await sync.push(); } catch (err) { alert("Backup failed: " + err.message); }
    renderSyncStatus();
  });

  document.getElementById("github-pull").addEventListener("click", async () => {
    try {
      const remote = await sync.pull();
      if (!hasUserData(remote)) { alert("No backup with data was found on GitHub."); return; }
      const when = remote.updatedAt ? fmtDateTime(remote.updatedAt) : "an unknown date";
      if (confirm(`Replace the data on this phone with the GitHub backup from ${when}?`)) {
        store.importJSON(JSON.stringify(remote));
        startDateInput.value = store.getState().startDate || "";
        alert("Data restored from GitHub.");
      }
    } catch (err) {
      alert("Restore failed: " + err.message);
    }
    renderSyncStatus();
  });

  document.getElementById("github-disconnect").addEventListener("click", () => {
    if (confirm("Disconnect GitHub backup? Data on this phone and the Gist on GitHub are both kept; only automatic backups stop.")) {
      sync.disconnect();
      renderSyncStatus();
    }
  });

  sync.onStatus(renderSyncStatus);
}

async function init() {
  setupTabs();
  setupSettings();

  // Ask the browser not to evict this site's storage under pressure.
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(() => {});
  }

  try {
    const [plan, weeks, groceries] = await Promise.all([loadPlan(), loadWeeks(), loadGroceries()]);
    setPlan(plan);
    setWeeks(weeks);
    setGroceries(groceries);
  } catch (e) {
    console.error(e);
  }

  if (!store.getState().startDate) {
    renderSyncStatus();
    document.getElementById("settings-modal").classList.remove("hidden");
  }

  renderCurrentTab();

  // Automatic backup: every change is uploaded a couple of seconds later.
  store.onChange(() => sync.scheduleSync());

  const reconcile = () => {
    sync.syncOnStart()
      .then((result) => { if (result === "pulled") renderCurrentTab(); })
      .catch((e) => console.error("Sync on start failed", e));
  };
  reconcile();
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") reconcile(); });
  window.addEventListener("online", () => { if (sync.getConfig().lastError) sync.push().catch(() => {}); });

  setupUpdates();
}

// --- App updates -----------------------------------------------------------
// The service worker serves cached files, so a new deploy only shows up once
// the new worker has installed and taken control. updateViaCache: "none"
// makes the browser re-fetch service-worker.js on every check instead of
// trusting GitHub Pages' 10-minute HTTP cache; the controllerchange reload
// then switches to the new files without a second manual launch.
async function swVersion() {
  const sw = navigator.serviceWorker && navigator.serviceWorker.controller;
  if (!sw) return "not cached yet";
  return new Promise((resolve) => {
    const ch = new MessageChannel();
    const t = setTimeout(() => resolve("unknown"), 1500);
    ch.port1.onmessage = (e) => { clearTimeout(t); resolve(String(e.data)); };
    sw.postMessage({ type: "version" }, [ch.port2]);
  });
}

async function showVersion() {
  const el = document.getElementById("app-version");
  if (!el) return;
  const sw = await swVersion();
  if (sw === APP_VERSION || !sw.startsWith("v")) {
    el.textContent = APP_VERSION;
    el.className = "";
  } else {
    el.textContent = `${sw}, but the app files are ${APP_VERSION} — tap Check for updates`;
    el.className = "status-err";
  }
}

function setupUpdates() {
  const btn = document.getElementById("check-update");
  if (!("serviceWorker" in navigator)) {
    if (btn) btn.disabled = true;
    showVersion();
    return;
  }

  let reloading = false;
  const hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    // A new worker took over (an update was installed). Reload once so the
    // page runs the new files. Skipped on the very first install, when there
    // was no previous controller.
    if (reloading || !hadController) return;
    reloading = true;
    window.location.reload();
  });

  navigator.serviceWorker.register("./service-worker.js", { updateViaCache: "none" })
    .then((reg) => {
      document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") reg.update().catch(() => {}); });
      if (btn) {
        btn.addEventListener("click", async () => {
          btn.disabled = true;
          btn.textContent = "Checking…";
          try {
            await reg.update();
            // If a new worker is installing, controllerchange will reload the page.
            await new Promise((r) => setTimeout(r, 2500));
            btn.textContent = reg.installing || reg.waiting ? "Updating…" : "Up to date ✓";
          } catch (e) {
            btn.textContent = "Could not check (offline?)";
          }
          setTimeout(() => { btn.textContent = "Check for updates"; btn.disabled = false; }, 2000);
        });
      }
    })
    .catch((e) => console.error("SW registration failed", e));

  document.getElementById("settings-btn").addEventListener("click", showVersion);
  showVersion();
}

init();
