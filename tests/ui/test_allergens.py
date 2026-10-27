import datetime, mimetypes, os, json
from playwright.sync_api import sync_playwright
from _helper import serve
start = (datetime.date.today() - datetime.timedelta(days=16)).isoformat()
seed = {"startDate": start, "foodTracker": {
    "Egg": {"status":"tried","tries":[{"date":"2026-10-18","reaction":"none"}]},
    "Yogurt": {"status":"tried","tries":[{"date":"2026-10-19","reaction":"none"}]},
    "Scrambled Egg Muffin": {"status":"tried","tries":[{"date":"2026-10-20","reaction":"none"}]},
}, "dailyLogs": {}, "groceryChecks": {}}
errors = []
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    ctx.add_init_script(f"localStorage.setItem('babyFoodPlan.v1', {json.dumps(json.dumps(seed))})")
    page = ctx.new_page(); page.route("http://app.local/**", serve)
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.goto("http://app.local/index.html"); page.wait_for_selector("#day-notes")
    page.click('.tab-btn[data-tab="tracker"]'); page.wait_for_selector("#allergen-chip")
    print("chip:", page.text_content("#allergen-chip").strip().replace("\n"," "), "| badges in list:", page.locator(".allergen-badge").count())
    print("Egg badge:", page.text_content('[data-food="Egg"] .allergen-badge'), "| custom:", page.text_content('[data-food="Scrambled Egg Muffin"] .allergen-badge'), "| Broccoli badge:", page.query_selector('[data-food="Broccoli"] .allergen-badge') is None)
    print("sub-titles (chip off):", page.evaluate("Array.from(document.querySelectorAll('.card')).slice(3).map(c => c.querySelector('.category-title').textContent.trim().split(' ')[1] + ': ' + Array.from(c.querySelectorAll('.sub-title')).map(h=>h.textContent.trim()).join(' | '))"))
    first_nuts = page.evaluate("Array.from(document.querySelectorAll('.card')).find(c => c.querySelector('.category-title') && c.querySelector('.category-title').textContent.includes('Nuts & Seeds')).querySelector('.food-row-wrap').dataset.food")
    print("first row in Nuts & Seeds:", first_nuts)
    page.click("#allergen-chip"); page.wait_for_selector("#allergen-chip.selected")
    print("groups (chip on):", page.evaluate("Array.from(document.querySelectorAll('.category-title')).map(h=>h.textContent.trim().replace(/\\s+/g,' '))"))
    print("sub-titles (chip on):", page.evaluate("Array.from(document.querySelectorAll('.sub-title')).map(h=>h.textContent.trim())"))
    print("rows:", page.locator(".food-row-wrap").count())
    page.click('[data-filter="tried"]'); page.wait_for_function("document.querySelectorAll('.food-row-wrap').length === 3")
    print("allergens + tried:", page.evaluate("Array.from(document.querySelectorAll('.food-row-wrap')).map(r=>r.dataset.food)"))
    page.click('[data-filter="all"]'); page.wait_for_function("document.querySelectorAll('.food-row-wrap').length > 3")
    page.evaluate("document.getElementById('view').scrollTo(0, 560)"); page.screenshot(path="_out/s10_allergens.png")
    page.click("#allergen-chip"); page.wait_for_function("!document.querySelector('#allergen-chip').classList.contains('selected')")
    print("off again rows:", page.locator(".food-row-wrap").count())
    b.close()
print("errors:", errors)
