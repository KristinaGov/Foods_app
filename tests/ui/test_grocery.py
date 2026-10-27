import datetime, mimetypes, os
from playwright.sync_api import sync_playwright
from _helper import serve
errors = []
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    page = ctx.new_page(); page.route("http://app.local/**", serve)
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.goto("http://app.local/index.html"); page.wait_for_selector("#settings-modal:not(.hidden)")
    # today = day 26 -> week 4
    page.fill("#start-date-input", (datetime.date.today() - datetime.timedelta(days=25)).isoformat()); page.dispatch_event("#start-date-input", "change")
    page.click("#close-settings"); page.wait_for_selector("#day-notes")
    page.click('.tab-btn[data-tab="grocery"]'); page.wait_for_selector(".grocery-item")
    print("nav:", page.text_content(".day-nav .current-date").strip().replace("\n", " "))
    names = page.evaluate("Array.from(document.querySelectorAll('.grocery-name')).map(e=>e.textContent)")
    print("items:", len(names), "| Broccoli present:", "Broccoli" in names)
    print("sections:", page.evaluate("Array.from(document.querySelectorAll('.grocery-category h3')).map(e=>e.textContent.trim())"))
    print("alt notes:", page.locator(".grocery-note.alt").count(), "| sample:", page.text_content(".grocery-note.alt"))
    page.check('[data-grocery-item="Broccoli"]'); page.wait_for_selector('.grocery-item.checked')
    print("count:", page.text_content(".grocery-count"))
    page.click("#next-week"); page.wait_for_selector(".grocery-item")
    print("week 5 nav:", page.text_content(".day-nav .current-date").strip().split("\n")[0], "| checked there:", page.locator(".grocery-item.checked").count())
    page.click("#prev-week"); page.wait_for_selector(".grocery-item.checked")
    page.reload(); page.wait_for_selector("#day-notes"); page.click('.tab-btn[data-tab="grocery"]'); page.wait_for_selector(".grocery-item.checked")
    print("persisted after reload:", page.locator(".grocery-item.checked").count())
    page.screenshot(path="_out/s6_grocery.png", full_page=True)
    for _ in range(10): page.click("#next-week")
    page.wait_for_selector(".grocery-item")
    print("end:", page.text_content(".day-nav .current-date").strip().split("\n")[0], "| next disabled:", page.is_disabled("#next-week"), "| items:", page.locator(".grocery-name").count())
    page.click("#clear-checks") if page.query_selector("#clear-checks") else None
    b.close()
print("errors:", errors)
