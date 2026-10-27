import pathlib, re
from playwright.sync_api import sync_playwright
SW = pathlib.Path(__file__).resolve().parents[2] / "app" / "service-worker.js"
orig = SW.read_text()
cur = re.search(r'baby-food-plan-v(\d+)', orig).group(1)
nxt = str(int(cur) + 1)
errors = []
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); ctx = b.new_context(viewport={"width": 390, "height": 844})
        page = ctx.new_page()
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.goto("http://127.0.0.1:8080/", wait_until="networkidle")
        page.wait_for_function("navigator.serviceWorker.controller !== null", timeout=15000)
        page.reload(wait_until="networkidle")
        page.wait_for_selector("#settings-modal:not(.hidden)")
        page.wait_for_function("document.getElementById('app-version').textContent.startsWith('v')", timeout=5000)
        print("version shown:", page.text_content("#app-version"))
        # Simulate a deploy where only the worker changed: expect the mismatch warning after auto-reload
        SW.write_text(orig.replace("baby-food-plan-v" + cur, "baby-food-plan-v" + nxt))
        page.click("#check-update")
        page.wait_for_function(f"document.getElementById('app-version').textContent.startsWith('v{nxt}')", timeout=15000)
        print("after update:", page.text_content("#app-version"), "| class:", page.get_attribute("#app-version", "class"), "| caches:", page.evaluate("caches.keys()"))
        b.close()
finally:
    SW.write_text(orig)
print("errors:", errors)
