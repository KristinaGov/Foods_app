import datetime, mimetypes, os, json, sys
from playwright.sync_api import sync_playwright
from _helper import serve
start = (datetime.date.today() - datetime.timedelta(days=25)).isoformat()
seed = {"startDate": start, "foodTracker": {
    "Broccoli": {"status":"tried","tries":[{"date":"2026-10-01","reaction":"liked"},{"date":"2026-10-05","reaction":"none"},{"date":"2026-10-09","reaction":"none"}]},
    "Mango": {"status":"tried","tries":[{"date":"2026-10-02","reaction":"none"},{"date":"2026-10-06","reaction":"none"}]},
    "Egg": {"status":"tried","tries":[{"date":"2026-10-08","reaction":"rash"}]},
    "Oats": {"status":"tried","tries":[{"date":"2026-10-04","reaction":"none"}]},
    "Apple": {"status":"tried","tries":[{"date":"2026-10-07","reaction":"none"}]},
}, "dailyLogs": {}, "groceryChecks": {}}
errors = []
with sync_playwright() as p:
    b = p.chromium.launch()
    for name, vp in [("iphone13", (390, 844)), ("iphoneSE", (375, 667)), ("iphone15max", (430, 932)), ("landscape", (844, 390))]:
        ctx = b.new_context(viewport={"width": vp[0], "height": vp[1]}, device_scale_factor=2)
        ctx.add_init_script(f"localStorage.setItem('babyFoodPlan.v1', {json.dumps(json.dumps(seed))}); localStorage.setItem('babyFoodPlan.theme','plum')")
        page = ctx.new_page(); page.route("http://app.local/**", serve)
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.goto("http://app.local/index.html"); page.wait_for_selector("#day-notes")
        page.click('.tab-btn[data-tab="tracker"]'); page.wait_for_selector(".activity-grid .tile")
        info = page.evaluate("""() => {
            const g = document.getElementById('activity-grid'), v = document.getElementById('view'), c = document.querySelector('.activity-card');
            const tiles = g.querySelectorAll('.tile');
            return { tiles: tiles.length, cols: g.style.gridTemplateColumns, tile: g.style.getPropertyValue('--tile'),
                     gridH: g.offsetHeight, cardH: c.offsetHeight, viewH: v.clientHeight, share: (c.offsetHeight / v.clientHeight).toFixed(2),
                     levels: {t1: g.querySelectorAll('.t1').length, t2: g.querySelectorAll('.t2').length, t3: g.querySelectorAll('.t3').length, rash: g.querySelectorAll('.rash').length},
                     first: tiles[0].dataset.tileFood, head: document.querySelector('.activity-head h2').textContent };
        }""")
        print(name, info)
        if name == "iphone13":
            page.screenshot(path="_out/s7_grid.png")
            page.click('.tile[data-tile-food="Egg"]'); page.wait_for_selector('[data-food="Egg"]')
            print("tile tap -> search:", page.input_value("#tracker-search"), "| rows:", page.locator(".food-row-wrap").count())
        ctx.close()
    b.close()
print("errors:", errors)
