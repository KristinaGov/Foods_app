// Colour scheme preference. Stored per device (not part of the data backup)
// and applied as data-theme on <html>; the token values live in styles.css.
const THEME_KEY = "babyFoodPlan.theme";

export const THEMES = [
  { key: "light", label: "Light", swatch: "linear-gradient(135deg, #fff8ec 50%, #2f8f6f 50%)", bar: "#2f8f6f" },
  { key: "plum", label: "Plum", swatch: "linear-gradient(135deg, #14101c 50%, #7c4dd4 50%)", bar: "#7c4dd4" },
  { key: "ocean", label: "Ocean", swatch: "linear-gradient(135deg, #0e1420 50%, #3f6fdd 50%)", bar: "#3f6fdd" },
  { key: "orchid", label: "Orchid", swatch: "linear-gradient(135deg, #1a0f1c 50%, #b9358f 50%)", bar: "#b9358f" }
];

export function getTheme() {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return THEMES.some((x) => x.key === t) ? t : "light";
  } catch (e) {
    return "light";
  }
}

export function applyTheme(key) {
  const theme = THEMES.find((x) => x.key === key) || THEMES[0];
  document.documentElement.dataset.theme = theme.key;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme.bar);
}

export function setTheme(key) {
  try { localStorage.setItem(THEME_KEY, key); } catch (e) { console.error(e); }
  applyTheme(key);
}
