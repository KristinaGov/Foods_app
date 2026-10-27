"""
Shared bits for the UI tests. The app is served to headless Chromium through
Playwright request interception (no HTTP server needed, which also works in
sandboxes that block local sockets). Each test gets a fresh browser context,
so localStorage starts empty unless the test seeds it.
"""
import mimetypes
import os
from urllib.parse import urlparse

APP = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "app"))
ORIGIN = "http://app.local"


def serve(route, request):
    path = urlparse(request.url).path.lstrip("/") or "index.html"
    full = os.path.join(APP, path)
    if not os.path.isfile(full):
        return route.fulfill(status=404, body="not found")
    ctype = mimetypes.guess_type(full)[0] or "application/octet-stream"
    if full.endswith(".js"):
        ctype = "text/javascript"
    if full.endswith(".webmanifest"):
        ctype = "application/manifest+json"
    route.fulfill(status=200, body=open(full, "rb").read(), content_type=ctype)


def new_page(browser, errors, viewport=(390, 844), init_script=None):
    """A page at phone size with the app routed from disk and console errors collected."""
    ctx = browser.new_context(viewport={"width": viewport[0], "height": viewport[1]}, device_scale_factor=2)
    if init_script:
        ctx.add_init_script(init_script)
    page = ctx.new_page()
    page.route(ORIGIN + "/**", serve)
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    return page
