import datetime, mimetypes, os, json
from playwright.sync_api import sync_playwright
from _helper import serve
today = datetime.date.today(); start = today - datetime.timedelta(days=25)   # today = day 26
d = lambda n: (start + datetime.timedelta(days=n-1)).isoformat()
seed = {"startDate": start.isoformat(), "foodTracker": {
    "Egg": {"status":"tried","tries":[{"date":d(8),"reaction":"none"},{"date":d(16),"reaction":"liked"}], "notes":"fine both times"},
    "Peanut": {"status":"tried","tries":[{"date":d(14),"reaction":"none"}]},
    "Broccoli": {"status":"tried","tries":[{"date":d(1),"reaction":"liked"}]},
}, "dailyLogs": {d(16): {"day":16,"reaction":"liked","notes":"Great day"}}, "groceryChecks": {"2026-10-01": {"x": True}, "week-4": {"Broccoli": True}}}
errors = []
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    ctx.add_init_script(f"localStorage.setItem('babyFoodPlan.v1', {json.dumps(json.dumps(seed))})")
    page = ctx.new_page(); page.route("http://app.local/**", serve)
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("dialog", lambda dlg: dlg.accept())
    page.goto("http://app.local/index.html"); page.wait_for_selector("#day-notes")
    st = lambda: json.loads(page.evaluate("localStorage.getItem('babyFoodPlan.v1')"))
    # 10. orphan ticks
    page.click('.tab-btn[data-tab="grocery"]'); page.wait_for_selector(".grocery-item")
    print("grocery keys after load:", list(st()["groceryChecks"].keys()))
    page.click('.tab-btn[data-tab="today"]'); page.wait_for_selector("#day-notes")
    # 3. repeat pills on day 26 + 4. allergen check
    print("repeat pills:", page.evaluate("Array.from(document.querySelectorAll('.new-food-pill')).map(b=>b.textContent)"))
    print("allergen check:", page.evaluate("Array.from(document.querySelectorAll('.exposure-row')).map(r=>r.textContent.trim().replace(/\\s+/g,' '))"))
    # 2. open recipe survives a pill tap
    page.click("details summary"); page.click('.new-food-pill[data-food="Egg"]'); page.wait_for_selector('.new-food-pill[data-food="Egg"]:not(.outline)')
    print("recipe still open:", page.evaluate("document.querySelector('details').open"), "| Egg tries:", len(st()["foodTracker"]["Egg"]["tries"]))
    print("allergen check after logging egg:", page.evaluate("Array.from(document.querySelectorAll('.exposure-row')).map(r=>r.textContent.trim().replace(/\\s+/g,' '))"))
    page.screenshot(path="_out/s11_today.png", full_page=True)
    # 1. search keeps focus
    page.click('.tab-btn[data-tab="tracker"]'); page.wait_for_selector("#tracker-search")
    page.click("#tracker-search"); page.keyboard.type("bro", delay=40)
    print("typed:", repr(page.input_value("#tracker-search")), "| focused:", page.evaluate("document.activeElement.id"), "| rows:", page.locator(".food-row-wrap").count(), "| show-all visible:", page.is_visible("#tracker-clear"))
    page.click("#tracker-clear"); page.wait_for_function("document.querySelectorAll('.food-row-wrap').length > 100")
    # 6. custom food added untried, removable
    page.fill("#custom-food-input", "Avocado"); page.click("#add-custom-food"); page.wait_for_selector('[data-food="Avocado"]')
    print("Avocado untried:", page.text_content('[data-food="Avocado"] .food-meta').strip(), "| in customFoods:", "Avocado" in st()["customFoods"], "| remove btn:", page.query_selector('[data-remove-custom="Avocado"]') is not None)
    page.click('[data-toggle="Avocado"]'); page.wait_for_selector('[data-food="Avocado"] .try-row')
    page.click('[data-food="Avocado"] .try-remove'); page.wait_for_selector('[data-remove-custom="Avocado"]')
    print("Avocado still listed after removing its only try:", page.query_selector('[data-food="Avocado"]') is not None)
    page.click('[data-remove-custom="Avocado"]'); page.wait_for_function("!document.querySelector('[data-food=\"Avocado\"]')")
    print("Avocado removed:", "Avocado" not in st()["customFoods"])
    # 5. timeline
    page.click('.tab-btn[data-tab="notes"]'); page.wait_for_selector(".timeline-try")
    print("timeline cards:", page.evaluate("Array.from(document.querySelectorAll('#view > .card:not(.search-bar) h2')).map(h=>h.textContent.trim())"))
    print("day16 card:", page.evaluate("Array.from(document.querySelectorAll('#view > .card')).find(c=>c.textContent.includes('Day 16')).textContent.trim().replace(/\\s+/g,' ')"))
    page.click('[data-notes-filter="reactions"]'); page.wait_for_selector(".timeline-try")
    print("reactions only:", page.evaluate("Array.from(document.querySelectorAll('.timeline-try .food-name')).map(e=>e.textContent.trim())"))
    page.click('[data-notes-filter="notes"]'); page.wait_for_selector("#view .card")
    print("notes only:", page.evaluate("Array.from(document.querySelectorAll('.timeline-note')).map(e=>e.textContent.trim())"))
    page.click('[data-notes-filter="all"]'); page.wait_for_selector(".timeline-try"); page.screenshot(path="_out/s11_timeline.png", full_page=True)
    b.close()
print("errors:", errors)
