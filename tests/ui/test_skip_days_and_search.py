"""Skipped days shift the plan (Today, Week calendar, Notes) and the Tracker
searches by word."""
import datetime, json
from playwright.sync_api import sync_playwright
from _helper import serve
today = datetime.date.today(); start = today - datetime.timedelta(days=25)   # today = day 26 without skips
d = lambda n: (start + datetime.timedelta(days=n-1)).isoformat()
seed = {"startDate": start.isoformat(), "skippedDays": [d(10)],                # day 10's date skipped -> today = day 25
        "foodTracker": {"Egg": {"status":"tried","tries":[{"date":d(8),"reaction":"none"}], "notes":"small rash on chin"},
                        "Broccoli": {"status":"tried","tries":[{"date":d(1),"reaction":"liked"},{"date":d(3),"reaction":"none"}]}},
        "dailyLogs": {d(10): {"notes": "Fever, no solids"}}, "groceryChecks": {}}
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
    badge = lambda: page.text_content("#day-badge").strip()
    print("today badge (one earlier skip):", badge())
    assert badge() == "Day 25 of 100", badge()
    # skip today -> only the comment remains
    page.click("#skip-day"); page.wait_for_selector("#unskip-day")
    print("after skip:", badge(), "| pills:", page.locator(".new-food-pill").count(), "| recipes:", page.locator("details").count(),
          "| cards:", page.evaluate("Array.from(document.querySelectorAll('#view .card h2')).map(h=>h.textContent.trim())"))
    assert badge() == "Skipped day" and page.locator(".new-food-pill").count() == 0 and page.locator("details").count() == 0
    page.fill("#day-notes", "Travelling today"); page.click("#save-day-notes"); page.wait_for_selector(".saved-note")
    print("skipped today saved:", today.isoformat() in st()["skippedDays"], "| note:", st()["dailyLogs"][today.isoformat()]["notes"])
    page.click("#next-day"); page.wait_for_selector(".new-food-pill")
    print("tomorrow:", badge(), "(plan shifted, day 25 moved)")
    assert badge() == "Day 25 of 100"
    page.click("#prev-day"); page.click("#prev-day"); page.wait_for_selector(".new-food-pill")
    print("yesterday:", badge()); assert badge() == "Day 24 of 100"
    page.click("#back-today"); page.wait_for_selector("#unskip-day")
    page.screenshot(path="_out/s12_skipped_today.png", full_page=True)
    # week tab calendar
    page.click('.tab-btn[data-tab="weeks"]'); page.wait_for_selector("#cal-grid")
    info = page.evaluate("""() => ({
        badge: document.getElementById('day-badge').textContent, cells: document.querySelectorAll('.cal-cell:not(.cal-legend .cal-cell)').length,
        skipped: Array.from(document.querySelectorAll('#cal-grid .cal-cell.skipped')).map(c => c.title),
        inWeek: Array.from(document.querySelectorAll('#cal-grid .cal-cell.in-week')).map(c => c.textContent),
        today: document.querySelector('#cal-grid .cal-cell.today')?.title, labels: Array.from(document.querySelectorAll('.cal-label')).map(l => l.textContent),
        head: document.querySelector('.cal-card .food-meta').textContent })""")
    print("week tab:", info)
    assert len(info["skipped"]) == 2 and info["badge"] == "Week 4 of 15" and info["inWeek"] == ["22", "23", "24", "⏭", "25", "26", "27", "28"]
    page.click('#cal-grid .cal-cell.skipped'); page.wait_for_selector("#cal-grid")
    print("tap first skipped cell ->", page.text_content("#day-badge"), "| skipped rows:", page.evaluate("Array.from(document.querySelectorAll('.skipped-row')).map(r => r.textContent.trim().replace(/\\s+/g,' '))"))
    assert page.text_content("#day-badge") == "Week 2 of 15"
    page.screenshot(path="_out/s12_week_calendar.png", full_page=True)
    # notes timeline label
    page.click('.tab-btn[data-tab="notes"]'); page.wait_for_selector("#view .card h2")
    print("timeline heads:", page.evaluate("Array.from(document.querySelectorAll('#view > .card:not(.search-bar) h2')).map(h=>h.textContent.trim())"))
    # undo skip
    page.click('.tab-btn[data-tab="today"]'); page.wait_for_selector("#unskip-day"); page.click("#unskip-day"); page.wait_for_selector("#skip-day")
    print("after undo:", badge(), "| skipped:", st()["skippedDays"]); assert badge() == "Day 25 of 100"
    # tracker word search
    page.click('.tab-btn[data-tab="tracker"]'); page.wait_for_selector("#tracker-search")
    print("search is first card:", page.evaluate("document.querySelector('#view .card').classList.contains('search-bar')"))
    names = lambda: page.evaluate("Array.from(document.querySelectorAll('.food-row-wrap')).map(e => e.dataset.food)")
    for q in ["nut butter", "puree", "rash", "egg", "Tree nut", "zzz"]:
        page.fill("#tracker-search", q); page.wait_for_timeout(150)
        print(f"  {q!r}: {page.text_content('#search-count').strip()} ->", names()[:8])
    assert page.evaluate("document.activeElement.id") == "tracker-search"
    page.click("#add-searched-food"); page.wait_for_selector('[data-food="zzz"]')
    print("added from search:", "zzz" in st()["customFoods"], "| marks:", page.evaluate("document.querySelectorAll('mark.hit').length"))
    page.screenshot(path="_out/s12_search.png", full_page=True)
    b.close()
print("errors:", errors)
