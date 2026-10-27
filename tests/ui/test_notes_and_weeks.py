import subprocess, time, sys, datetime
from playwright.sync_api import sync_playwright
from _helper import serve

errors = []
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        page = ctx.new_page()
        page.route("http://app.local/**", serve)
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.goto("http://app.local/index.html")
        page.wait_for_selector("#settings-modal:not(.hidden)")
        # Day 1 = 16 days ago -> today is day 17, week 3
        start = (datetime.date.today() - datetime.timedelta(days=16)).isoformat()
        page.fill("#start-date-input", start)
        page.dispatch_event("#start-date-input", "change")
        page.click("#close-settings")
        page.wait_for_selector("#day-notes")
        print("badge:", page.text_content("#day-badge"))
        assert page.query_selector("#edit-day-notes") is None, "no note yet -> no Edit button"
        page.fill("#day-notes", "Loved the pear, spat out the peanut swirl.")
        page.click("#save-day-notes")
        page.wait_for_selector(".saved-note")
        assert page.query_selector("#day-notes") is None, "textarea should be gone after save"
        print("saved note:", page.text_content(".saved-note"), "| badge:", page.text_content(".saved-badge"))
        page.screenshot(path="_out/shot_saved.png", full_page=True)
        # persisted?
        page.reload(); page.wait_for_selector(".saved-note")
        print("after reload:", page.text_content(".saved-note"))
        # edit flow
        page.click("#edit-day-notes"); page.wait_for_selector("#day-notes")
        assert page.input_value("#day-notes").startswith("Loved")
        page.click("#cancel-day-notes"); page.wait_for_selector(".saved-note")
        page.click("#edit-day-notes"); page.fill("#day-notes", "Edited note"); page.click("#save-day-notes")
        page.wait_for_selector(".saved-note")
        print("after edit:", page.text_content(".saved-note"))
        # other day has its own empty textarea
        page.click("#next-day"); page.wait_for_selector("#day-notes")
        assert page.query_selector(".saved-note") is None
        # Weeks tab
        page.click('.tab-btn[data-tab="weeks"]')
        page.wait_for_selector(".week-day-row")
        print("weeks badge:", page.text_content("#day-badge"), "|", page.text_content(".day-nav .current-date"))
        print("title:", page.text_content("#view .card h2"))
        page.screenshot(path="_out/shot_weeks.png", full_page=True)
        page.click("#prev-week-ov"); page.click("#prev-week-ov")
        print("after prev x2:", page.text_content(".day-nav .current-date"), "| prev disabled:", page.is_disabled("#prev-week-ov"))
        for _ in range(14): page.click("#next-week-ov")
        print("at end:", page.text_content(".day-nav .current-date"), "| next disabled:", page.is_disabled("#next-week-ov"))
        print("week 15 rows:", len(page.query_selector_all(".week-day-row")))
        page.screenshot(path="_out/shot_week15.png", full_page=True)
        # Notes history still works
        page.click('.tab-btn[data-tab="notes"]'); page.wait_for_selector("#view .card")
        print("notes tab:", page.text_content("#view .card")[:80])
        b.close()
finally:
    pass
print("errors:", errors)
