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
    page.click("#close-settings"); page.click('.tab-btn[data-tab="tracker"]'); page.wait_for_selector(".tile")
    rows = lambda: page.locator(".food-row-wrap").count()
    print("all:", rows(), "| clear btn:", page.query_selector("#tracker-clear") is not None)
    page.click('.tile[data-tile-food="Egg"]'); page.wait_for_selector("#tracker-clear")
    print("after tile:", rows(), "| selected tiles:", page.locator(".tile.selected").count())
    page.screenshot(path="_out/s8_selected.png", clip={"x":0,"y":100,"width":390,"height":480})
    page.click('.tile[data-tile-food="Egg"]'); page.wait_for_selector(".tile:not(.selected)")
    page.wait_for_function("document.querySelectorAll('.food-row-wrap').length > 100")
    print("after second tap:", rows(), "| clear btn:", page.query_selector("#tracker-clear") is not None)
    page.click('.tile[data-tile-food="Mango"]'); page.wait_for_selector("#tracker-clear")
    page.click("#tracker-clear"); page.wait_for_function("document.querySelectorAll('.food-row-wrap').length > 100")
    print("after Show all:", rows(), "| search value:", repr(page.input_value("#tracker-search")))
    b.close()
print("errors:", errors)
