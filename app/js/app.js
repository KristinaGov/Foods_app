import { store, loadPlan } from "./store.js";
import { setPlan, renderToday, renderTracker, renderGrocery, renderNotes } from "./views.js";

const renderers = { today: renderToday, tracker: renderTracker, grocery: renderGrocery, notes: renderNotes };
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

function setupSettings() {
  const modal = document.getElementById("settings-modal");
  const startDateInput = document.getElementById("start-date-input");
  const state = store.getState();
  if (state.startDate) startDateInput.value = state.startDate;

  document.getElementById("settings-btn").addEventListener("click", () => {
    modal.classList.remove("hidden");
  });
  document.getElementById("close-settings").addEventListener("click", () => {
    modal.classList.add("hidden");
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
}

async function init() {
  setupTabs();
  setupSettings();

  try {
    const plan = await loadPlan();
    setPlan(plan);
  } catch (e) {
    console.error(e);
  }

  if (!store.getState().startDate) {
    document.getElementById("settings-modal").classList.remove("hidden");
  }

  renderCurrentTab();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js").catch((e) => console.error("SW registration failed", e));
  }
}

init();
