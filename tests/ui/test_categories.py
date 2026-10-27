import datetime, mimetypes, os, json
from playwright.sync_api import sync_playwright
from _helper import serve
start = (datetime.date.today() - datetime.timedelta(days=16)).isoformat()
seed = {"startDate": start, "foodTracker": {
    "Broccoli": {"status":"tried","tries":[{"date":"2026-10-11","reaction":"liked"}]},
    "Egg": {"status":"tried","tries":[{"date":"2026-10-18","reaction":"none"}]},
    "Baked Sweet Potato Mash": {"status":"tried","tries":[{"date":"2026-10-20","reaction":"none"}]},
}, "dailyLogs": {}, "groceryChecks": {}}
errors = []
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    ctx.add_init_script(f"localStorage.setItem('babyFoodPlan.v1', {json.dumps(json.dumps(seed))})")
    page = ctx.new_page(); page.route("http://app.local/**", serve)
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.goto("http://app.local/index.html"); page.wait_for_selector("#day-notes")
    page.click('.tab-btn[data-tab="tracker"]'); page.wait_for_selector(".category-title")
    print("chips:", page.evaluate("Array.from(document.querySelectorAll('[data-category]')).map(b=>b.textContent.trim().replace(/\\s+/g,' '))"))
    print("sections:", page.evaluate("Array.from(document.querySelectorAll('.category-title')).map(h=>h.textContent.trim().replace(/\\s+/g,' '))"))
    print("rows total:", page.locator(".food-row-wrap").count())
    page.click('[data-category="Vegetables"]'); page.wait_for_function("document.querySelectorAll('.category-title').length === 1")
    print("Vegetables only:", page.text_content(".category-title").strip().replace("\n"," "), "| rows:", page.locator(".food-row-wrap").count(),
          "| custom food there:", page.query_selector('[data-food="Baked Sweet Potato Mash"]') is not None)
    page.click('[data-filter="tried"]'); page.wait_for_function("document.querySelectorAll('.food-row-wrap').length === 2")
    print("Vegetables + tried:", page.evaluate("Array.from(document.querySelectorAll('.food-row-wrap')).map(r=>r.dataset.food)"))
    page.click('[data-category="Vegetables"]'); page.wait_for_function("document.querySelectorAll('.category-title').length === 2")
    print("chip toggled off -> tried across categories:", page.locator(".category-title").count())
    page.click('[data-filter="all"]'); page.wait_for_function("document.querySelectorAll('.food-row-wrap').length === 139")
    page.screenshot(path="_out/s9_categories.png", full_page=False)
    page.evaluate("document.getElementById('view').scrollTo(0, 520)"); page.screenshot(path="_out/s9_list.png")
    b.close()
print("errors:", errors)
