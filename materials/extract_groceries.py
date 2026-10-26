"""
Extracts the weekly "Ingredient List" tables from the source PDF into
app/data/groceries.json, keyed by plan week ("1".."15"; weeks 14 and 15
share one list in the PDF and get the same entry).

Each week is a list of sections in PDF order (Dairy, Meat, or Fish / Pantry /
Produce / Check for Leftovers), each with items {item, qty, note}. The note
column is where the PDF puts substitutes ("substitute banana") and buying
hints, so it is kept verbatim.

Column boundaries are read from the "Quantity" and "Notes" header words on
every page rather than hard-coded, and rows that wrap onto two lines (long
names or notes) are merged by vertical proximity.

Run from the repo root:  .venv/bin/python materials/extract_groceries.py
"""
import json
import re
import pdfplumber

PDF_PATH = "materials/Solid-Starts-First-100-Days-1.pdf"
OUT_PATH = "app/data/groceries.json"

TITLE_RE = re.compile(r"Weeks?\s+([\d\s+]+?):\s*Ingredient List")
ROW_GAP = 10      # lines closer than this (pt) belong to the same table row
LINE_TOL = 2.5


def lines_of(words):
    buckets = {}
    for w in words:
        buckets.setdefault(round(w["top"] / LINE_TOL) * LINE_TOL, []).append(w)
    return [(top, sorted(ws, key=lambda w: w["x0"])) for top, ws in sorted(buckets.items())]


def weeks_from_title(text):
    m = TITLE_RE.search(text)
    if not m:
        return []
    return [int(n) for n in re.findall(r"\d+", m.group(1))]


def parse_page(page):
    """Returns (weeks, [(section_name, [row, ...]), ...]) for one page."""
    words = page.extract_words()
    lines = lines_of(words)
    text = " ".join(w["text"] for w in words[:12])
    weeks = weeks_from_title(text)
    if not weeks:
        return [], []

    sections = []
    qty_x = notes_x = None
    current_rows = []
    row = None
    last_top = None

    def flush_row():
        nonlocal row
        if row and row["item"]:
            current_rows.append({k: " ".join(v).strip() for k, v in row.items()})
        row = None

    for top, ws in lines:
        texts = [w["text"] for w in ws]
        if texts and texts[0] == "✓":
            # Section header: "✓ <Section name> Quantity Notes"
            flush_row()
            qty_x = next(w["x0"] for w in ws if w["text"] == "Quantity")
            notes_x = next(w["x0"] for w in ws if w["text"] == "Notes")
            name = " ".join(t for t in texts[1:] if t not in ("Quantity", "Notes"))
            current_rows = []
            sections.append((name, current_rows))
            last_top = None
            continue
        if qty_x is None:
            continue  # still above the first table
        joined = " ".join(texts)
        if joined.startswith(("Handy Conversions", "Ingredient list continued", "Back to Table", "1 pound =")):
            flush_row()
            qty_x = None  # table ended on this page
            continue

        cols = {"item": [], "qty": [], "note": []}
        for w in ws:
            if w["x0"] < qty_x - 3:
                cols["item"].append(w["text"])
            elif w["x0"] < notes_x - 3:
                cols["qty"].append(w["text"])
            else:
                cols["note"].append(w["text"])

        same_row = row is not None and last_top is not None and (top - last_top) < ROW_GAP
        if not same_row:
            flush_row()
            row = {"item": [], "qty": [], "note": []}
        for k in cols:
            row[k].extend(cols[k])
        last_top = top
    flush_row()
    return weeks, sections


def main():
    data = {}
    with pdfplumber.open(PDF_PATH) as pdf:
        for page in pdf.pages:
            head = (page.extract_text() or "")[:120]
            if "Ingredient List" not in head:
                continue
            weeks, sections = parse_page(page)
            if not weeks:
                continue
            key = "+".join(str(w) for w in weeks)
            entry = data.setdefault(key, [])
            for name, rows in sections:
                # "(Cont.)" pages repeat the section header; merge into the existing one.
                existing = next((s for s in entry if s["name"] == name), None)
                if existing:
                    existing["items"].extend(rows)
                else:
                    entry.append({"name": name, "items": rows})

    # Weeks 14 and 15 share the "14+15" list.
    out = {}
    for key, sections in data.items():
        for w in key.split("+"):
            out[w] = sections
    out = dict(sorted(out.items(), key=lambda kv: int(kv[0])))

    with open(OUT_PATH, "w") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    for w, sections in out.items():
        print(f"week {w}: " + ", ".join(f"{s['name']} ({len(s['items'])})" for s in sections))


if __name__ == "__main__":
    main()
