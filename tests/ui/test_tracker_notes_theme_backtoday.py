import datetime, mimetypes, os
from playwright.sync_api import sync_playwright
from _helper import serve
errors = []
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    page = ctx.new_page(); page.route("http://app.local/**", serve)
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.goto("http://app.local/index.html")
    page.wait_for_selector("#settings-modal:not(.hidden)")
    start = (datetime.date.today() - datetime.timedelta(days=16)).isoformat()
    page.fill("#start-date-input", start); page.dispatch_event("#start-date-input", "change")
    print("theme swatches:", page.locator(".theme-swatch").count(), "| selected:", page.text_content(".theme-swatch.selected").strip())
    page.click("#close-settings"); page.wait_for_selector("#day-notes")
    # 2. back to today
    assert page.query_selector("#back-today") is None
    page.click("#prev-day"); page.click("#prev-day"); page.wait_for_selector("#back-today")
    print("offset -2:", page.text_content("#day-badge"))
    page.click("#back-today"); page.wait_for_selector("#prev-day")
    print("after back:", page.text_content("#day-badge"), "| btn gone:", page.query_selector("#back-today") is None)
    page.screenshot(path="_out/s2_today_btn.png")
    # 1. tracker notes
    page.click('.tab-btn[data-tab="tracker"]'); page.wait_for_selector("#tracker-search")
    page.fill("#tracker-search", "Broccoli"); page.wait_for_selector('[data-toggle="Broccoli"]')
    page.click('[data-toggle="Broccoli"]'); page.wait_for_selector('.food-notes[data-notes-food="Broccoli"]')
    assert page.query_selector('[data-edit-note="Broccoli"]') is None
    page.fill('.food-notes[data-notes-food="Broccoli"]', "Gagged a bit, then fine."); page.click('[data-save-note="Broccoli"]')
    page.wait_for_selector(".saved-note")
    print("tracker saved:", page.text_content(".saved-note").strip(), "| textarea gone:", page.query_selector(".food-notes") is None)
    page.reload(); page.wait_for_selector("#prev-day")
    page.click('.tab-btn[data-tab="tracker"]'); page.fill("#tracker-search", "Broccoli"); page.wait_for_selector(".saved-note")
    page.click('[data-edit-note="Broccoli"]'); page.wait_for_selector(".food-notes")
    assert page.input_value(".food-notes").startswith("Gagged")
    page.click('[data-cancel-note="Broccoli"]'); page.wait_for_selector(".saved-note")
    page.click('[data-edit-note="Broccoli"]'); page.fill(".food-notes", "Edited"); page.click('[data-save-note="Broccoli"]'); page.wait_for_selector(".saved-note")
    print("tracker edited:", page.text_content(".saved-note").strip())
    page.screenshot(path="_out/s2_tracker.png")
    # 3. themes
    for key in ["plum", "ocean", "orchid"]:
        page.click("#settings-btn"); page.wait_for_selector("#settings-modal:not(.hidden)")
        page.click(f'[data-theme-key="{key}"]')
        print(key, "html data-theme:", page.evaluate("document.documentElement.dataset.theme"), "| meta:", page.get_attribute('meta[name="theme-color"]', "content"),
              "| stored:", page.evaluate("localStorage.getItem('babyFoodPlan.theme')"))
        page.screenshot(path=f"_out/s2_settings_{key}.png")
        page.click("#close-settings"); page.click('.tab-btn[data-tab="today"]'); page.wait_for_selector("#day-notes, .saved-note")
        page.screenshot(path=f"_out/s2_today_{key}.png", full_page=True)
    page.reload(); page.wait_for_selector("#prev-day")
    print("after reload theme:", page.evaluate("document.documentElement.dataset.theme"))
    page.click('.tab-btn[data-tab="weeks"]'); page.wait_for_selector(".week-day-row"); page.screenshot(path="_out/s2_weeks_orchid.png")
    b.close()
print("errors:", errors)
