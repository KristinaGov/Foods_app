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
    page.fill("#start-date-input", (datetime.date.today() - datetime.timedelta(days=16)).isoformat()); page.dispatch_event("#start-date-input", "change")
    page.click("#close-settings"); page.wait_for_selector("#day-notes")
    page.click('.tab-btn[data-tab="tracker"]'); page.wait_for_selector(".food-icon")
    print("icons rendered:", page.locator(".food-icon").count())
    page.fill("#custom-food-input", "Baked Sweet Potato Mash"); page.click("#add-custom-food")
    page.fill("#custom-food-input", "Zebra Meat"); page.click("#add-custom-food")
    page.fill("#tracker-search", "a"); page.wait_for_selector(".food-icon")
    icons = page.evaluate("Array.from(document.querySelectorAll('.food-row')).map(r => r.querySelector('.food-icon').textContent + ' ' + r.querySelector('.food-name').textContent)")
    print([i for i in icons if 'Baked' in i or 'Zebra' in i or i.endswith('Apple') or 'Broccoli' in i])
    page.fill("#tracker-search", ""); page.wait_for_selector(".food-icon")
    page.screenshot(path="_out/s4_tracker_icons.png")
    b.close()
print("errors:", errors)
