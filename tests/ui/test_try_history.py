import datetime, mimetypes, os, json
from playwright.sync_api import sync_playwright
from _helper import serve
today = datetime.date.today()
start = today - datetime.timedelta(days=16)
d = lambda n: (start + datetime.timedelta(days=n-1)).isoformat()
legacy = {"startDate": start.isoformat(), "foodTracker": {"Broccoli": {"status":"tried","firstDate": d(1),"reaction":"liked","notes":"old note","timesServed":1}}, "dailyLogs": {}, "groceryChecks": {}}
errors = []
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    ctx.add_init_script(f"localStorage.setItem('babyFoodPlan.v1', {json.dumps(json.dumps(legacy))})")
    page = ctx.new_page(); page.route("http://app.local/**", serve)
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("dialog", lambda dlg: dlg.accept())
    page.goto("http://app.local/index.html"); page.wait_for_selector("#day-notes")
    st = lambda: page.evaluate("JSON.parse(localStorage.getItem('babyFoodPlan.v1')).foodTracker")
    print("migrated:", st()["Broccoli"].get("tries"))
    # Today tab day 17: broccoli not in today's foods; go to day 1 (broccoli) -> shows ✓; day 9 (Broccoli Egg Strip? newFoods?) 
    for _ in range(16): page.click("#prev-day")
    page.wait_for_selector("#back-today")
    pills = page.evaluate("Array.from(document.querySelectorAll('.new-food-pill')).map(b=>b.textContent)")
    print("day1 pills:", pills)
    page.click('.new-food-pill[data-food="Hemp Seeds"]'); page.wait_for_selector('.new-food-pill[data-food="Hemp Seeds"]:not(.outline)')
    page.click("#next-day")  # day 2
    page.click("#back-today"); page.wait_for_selector("#day-notes")
    # Tracker
    page.click('.tab-btn[data-tab="tracker"]'); page.fill("#tracker-search", "Broccoli"); page.wait_for_selector(".try-row")
    print("meta:", page.text_content('[data-food="Broccoli"] .food-meta').strip(), "| note shown:", page.text_content(".saved-note").strip())
    page.click('[data-add-try="Broccoli"]'); page.wait_for_selector(".try-row:nth-of-type(2)")
    print("after add:", page.text_content('[data-food="Broccoli"] .food-meta').strip())
    # newest first => first row is today's try; set reaction disliked
    page.select_option('.try-row:first-child select', "disliked"); page.wait_for_selector(".try-row")
    e = st()["Broccoli"]; print("tries:", e["tries"], "| latest:", e["reaction"], "| first:", e["firstDate"])
    # change today's try date to day 5 -> sorts, firstDate stays day1
    page.fill('.try-row:first-child input[type=date]', d(5)); page.dispatch_event('.try-row:first-child input[type=date]', "change"); page.wait_for_selector(".try-row")
    e = st()["Broccoli"]; print("after date edit:", [t["date"] for t in e["tries"]], "| latest:", e["reaction"])
    page.screenshot(path="_out/s5_tries.png")
    # remove day-1 try (second row = oldest)
    page.click('.try-row:nth-child(2) .try-remove'); page.wait_for_selector(".try-row")
    e = st()["Broccoli"]; print("after remove:", e["tries"], "| first:", e["firstDate"], "| meta:", page.text_content('[data-food="Broccoli"] .food-meta').strip())
    # remove last try (confirm auto-accepted) -> not tried
    page.click('.try-row .try-remove'); page.wait_for_selector('[data-toggle="Broccoli"].not-tried')
    print("Broccoli gone:", "Broccoli" not in st())
    # Mark tried from chip -> one try today
    page.click('[data-toggle="Broccoli"]'); page.wait_for_selector(".try-row")
    print("chip mark:", st()["Broccoli"]["tries"])
    print("Hemp Seeds from Today pill:", st()["Hemp Seeds"]["tries"])
    # Tried count filter
    page.fill("#tracker-search", ""); page.wait_for_selector("[data-filter=tried]")
    print("filter label:", page.text_content("[data-filter=tried]"))
    b.close()
print("errors:", errors)
