"""
Extracts complete per-day data (title, new foods, allergens, and full recipe
instructions) directly from the source PDF using word coordinates, instead of
the flattened .txt file. This supersedes parse_plan2.py's header-row parsing,
which silently dropped any title/newFoods/allergens text that wrapped onto a
second line (verified bug: e.g. Day 50's allergens were missing "Peanut" and
"Sesame" because they wrapped to line 2 of the "Common IgE Allergens" cell).

Column x0 thresholds (in PDF points) were derived empirically from word
positions across multiple sample pages (see session notes) and are stable
because the source table uses fixed-width columns per page.
"""
import re
import json
import pdfplumber

PDF_PATH = "materials/Solid-Starts-First-100-Days-1.pdf"

# Header zone (day/title/newFoods/allergens row, above "Yield:")
HEADER_TITLE_MAX = 460
HEADER_NEWFOODS_MAX = 650
# Body zone (recipe content, below "Yield:")
BODY_LEFT_MAX = 195   # Ingredients / Modifications column
BODY_MID_MAX = 465    # Prepare/instructions column; >= this is How to Serve/Store column

DAY_HEADER_RE = re.compile(
    r"Weeks?\s+([\d+\s]+)[:|]\s*Day\s+(\d+)\s*(?:\|\s*(Solid Foods Meal(?:\s*\d+)?|Family Meal to Share with Baby))?"
)


def group_lines(words, tol=2.5):
    """Group words into lines by vertical position, return list of (top, [words sorted by x0])."""
    buckets = {}
    for w in words:
        key = round(w["top"] / tol) * tol
        buckets.setdefault(key, []).append(w)
    lines = []
    for top in sorted(buckets):
        ws = sorted(buckets[top], key=lambda w: w["x0"])
        lines.append((top, ws))
    return lines


def tokens_from_line_words(ws, gap=10):
    """Split a line's words into tokens (e.g. separate food names) using horizontal
    gaps, without splitting inside parentheses (e.g. "Tree Nut (Almond, Cashew)")."""
    tokens = []
    current = []
    last_x1 = None
    paren_depth = 0
    for w in ws:
        if last_x1 is not None and w["x0"] - last_x1 > gap and paren_depth == 0:
            tokens.append(" ".join(t["text"] for t in current))
            current = []
        current.append(w)
        last_x1 = w["x1"]
        paren_depth += w["text"].count("(") - w["text"].count(")")
        paren_depth = max(paren_depth, 0)
    if current:
        tokens.append(" ".join(t["text"] for t in current))
    return tokens


def line_text(ws):
    return " ".join(w["text"] for w in ws)


def _looks_like_continuation(text):
    """True if text looks like a wrapped allergen/food continuation (e.g. "Cashew)")
    rather than leaked instruction/serving paragraph text sharing the same x-range."""
    t = text.strip()
    if not t or "." in t:
        return False
    # Food/allergen names are Title Case ("Acorn Squash", "Tree Nut (Almond,
    # Cashew)"); a lowercase word means instruction text leaked into this
    # x-range (verified: Day 36 picked up "Whisk the peanut" from the
    # "Prepare the dip. Whisk the peanut..." step before this check existed).
    return all(w[0].isupper() or w[0] == "(" for w in t.split())


CAPTION_LINES = {"Your Meal", "Baby's Meal", "Baby\u2019s Meal"}
# Short all-Capitalized-Words lines (no connectors) following a "Click an icon"
# prompt are the row of food-name labels under the nutrient icons, not content.
ICON_LABEL_RE = re.compile(r"^[A-Z][a-zA-Z'\u2019]*(?:\s[A-Z][a-zA-Z'\u2019]*){0,4}$")


def extract_page(page):
    """Return dict with header zone (title_lines, newfoods, allergens) and body zone
    (ingredients_lines, modifications_lines, instructions_lines, serving_lines),
    plus whether this page has its own Yield/Ingredients (i.e. is a primary page vs continuation)."""
    words = page.extract_words()
    lines = group_lines(words)

    yield_top = None
    ingredients_top = None
    for top, ws in lines:
        txt = line_text(ws)
        if txt.startswith("Yield:") and yield_top is None:
            yield_top = top
        if txt.strip() == "Ingredients" and ingredients_top is None:
            ingredients_top = top

    is_primary = yield_top is not None
    # The newFoods/allergens column can wrap to more lines than the title column,
    # overflowing past the Yield: line when the header row is tall, so it needs
    # its own (more generous) cutoff based on where the Ingredients list starts.
    if ingredients_top is None:
        ingredients_top = (yield_top + 60) if yield_top is not None else None

    header_title_lines = []
    newfoods_tokens = []
    allergens_tokens = []
    yield_text = ""
    cook_time_text = ""
    ingredients_lines = []
    modifications_lines = []
    instructions_tokens = []
    serving_lines = []

    if not is_primary:
        # Continuation pages use a different, single-column template (with
        # "Your Meal" / "Baby's Meal" photo captions interspersed) rather than
        # the 3-column recipe layout, so classify by "How to Serve:" / "How to
        # Store:" markers instead of x0 position.
        body_lines = []
        for top, ws in lines:
            txt = line_text(ws)
            if txt.startswith("Week") and re.search(r"Day\s+\d+", txt):
                continue
            if txt.strip() in CAPTION_LINES:
                continue
            if txt.startswith("Click an icon"):
                break
            if top > 580:
                continue
            if top < 60:  # the repeated "<Title> (Cont.)" line
                continue
            body_lines.append(txt)
        combined = " ".join(body_lines)
        serve_idx = combined.find("How to Serve:")
        if serve_idx != -1:
            instructions_tokens = [combined[:serve_idx]] if combined[:serve_idx].strip() else []
            serving_lines = [combined[serve_idx:]]
        else:
            instructions_tokens = [combined] if combined.strip() else []
            serving_lines = []
        return {
            "is_primary": False,
            "title_lines": [],
            "newfoods": [],
            "allergens": [],
            "yield": "",
            "cook_time": "",
            "ingredients_lines": [],
            "modifications_lines": [],
            "instructions_lines": instructions_tokens,
            "serving_lines": serving_lines,
        }

    in_modifications = False
    seen_icons = False
    for top, ws in lines:
        txt = line_text(ws)

        if txt.startswith("Week") and re.search(r"Day\s+\d+", txt):
            continue  # the "Week X: Day N | ..." line itself
        if ("Allergens" in txt and "Common" in txt) or txt.strip() == "":
            continue  # the "New Foods Introduced / Common IgE Allergens" column header
                       # (occasionally rendered with doubled characters in the source PDF)

        title_ws = [w for w in ws if w["x0"] < HEADER_TITLE_MAX] if top < yield_top else []
        newfoods_ws = [w for w in ws if HEADER_TITLE_MAX <= w["x0"] < HEADER_NEWFOODS_MAX] if top < ingredients_top else []
        allergens_ws = [w for w in ws if w["x0"] >= HEADER_NEWFOODS_MAX] if top < ingredients_top else []
        if top >= yield_top:
            # Past the strict header zone: only accept newFoods/allergens overflow
            # text that looks like a continuation (e.g. "Cashew)"), not leaked
            # instruction/serving paragraph text that happens to share the x-range.
            if newfoods_ws and not _looks_like_continuation(line_text(newfoods_ws)):
                newfoods_ws = []
            if allergens_ws and not _looks_like_continuation(line_text(allergens_ws)):
                allergens_ws = []
        if title_ws:
            header_title_lines.append(line_text(title_ws))
        if newfoods_ws:
            newfoods_tokens.extend(tokens_from_line_words(newfoods_ws))
        if allergens_ws:
            allergens_tokens.extend(tokens_from_line_words(allergens_ws))
        consumed = set(id(w) for w in title_ws + newfoods_ws + allergens_ws)
        ws = [w for w in ws if id(w) not in consumed]
        if not ws:
            continue
        txt = line_text(ws)

        if txt.startswith("Yield:"):
            yield_text = txt[len("Yield:"):].strip()
            continue
        if txt.startswith("Cook Time:"):
            cook_time_text = txt[len("Cook Time:"):].strip()
            continue
        if txt.strip() == "Ingredients":
            continue
        if txt.strip() == "Modifications" or txt.strip().startswith("Modifications "):
            in_modifications = True
            rest = txt.strip()[len("Modifications"):].strip()
            if rest:
                modifications_lines.append(rest)
            continue
        if txt.startswith("Click an icon"):
            seen_icons = True
            continue  # this line alone; the food-icon label row is filtered below
        if top > 580:  # footer / back-to-contents line
            continue

        left_ws = [w for w in ws if w["x0"] < BODY_LEFT_MAX]
        mid_ws = [w for w in ws if BODY_LEFT_MAX <= w["x0"] < BODY_MID_MAX]
        right_ws = [w for w in ws if w["x0"] >= BODY_MID_MAX]

        if left_ws:
            left_text = line_text(left_ws)
            if seen_icons and ICON_LABEL_RE.match(left_text.strip()):
                pass  # food-name label under the "Click an icon" prompt, not real content
            elif in_modifications:
                modifications_lines.append(left_text)
            else:
                ingredients_lines.append(left_text)
        if mid_ws and not (seen_icons and ICON_LABEL_RE.match(line_text(mid_ws).strip())):
            instructions_tokens.append(line_text(mid_ws))
        if right_ws and not (seen_icons and ICON_LABEL_RE.match(line_text(right_ws).strip())):
            serving_lines.append(line_text(right_ws))

    return {
        "is_primary": is_primary,
        "title_lines": header_title_lines,
        "newfoods": merge_paren_continuations(newfoods_tokens),
        "allergens": merge_paren_continuations(allergens_tokens),
        "yield": yield_text,
        "cook_time": cook_time_text,
        "ingredients_lines": ingredients_lines,
        "modifications_lines": modifications_lines,
        "instructions_lines": instructions_tokens,
        "serving_lines": serving_lines,
    }


def _undouble(text):
    """Collapse the rare PDF rendering artifact where every character is
    doubled (e.g. "NNoonnee" -> "None"), without touching normal text."""
    if len(text) >= 2 and len(text) % 2 == 0 and all(text[i] == text[i + 1] for i in range(0, len(text), 2)):
        return text[0::2]
    return text


def merge_paren_continuations(tokens):
    """Join a wrapped "(Almond, Cashew)" continuation line back onto the
    preceding token (e.g. "Tree Nut") instead of treating it as separate items."""
    merged = []
    for t in tokens:
        t = _undouble(t)
        if merged and (t.startswith("(") or merged[-1].count("(") > merged[-1].count(")")):
            merged[-1] = (merged[-1] + " " + t).strip()
        else:
            merged.append(t)
    return merged


ICON_TAIL_RE = re.compile(r"[a-z][.,!:;]*(\s+(?:[A-Z][a-zA-Z\u2019']*\s*){2,8})$")


def strip_icon_tail(text):
    """Remove a trailing run of Title Case words (the food-icon label row) that
    landed on the same line as the last real sentence of instructions/serving text."""
    m = ICON_TAIL_RE.search(text)
    return text[:m.start(1)].rstrip() if m else text


def merge_bullets(lines):
    """Merge "• item" lines with their wrapped continuation lines into full items."""
    items = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("•"):
            items.append(stripped[1:].strip())
        elif items:
            items[-1] = (items[-1] + " " + stripped).strip()
    return items


def split_serving(serving_lines):
    text = " ".join(serving_lines)
    text = re.sub(r"\s+", " ", text).strip()
    serve_idx = text.find("How to Serve:")
    store_idx = text.find("How to Store:")
    how_to_serve = ""
    how_to_store = ""
    if serve_idx != -1:
        end = store_idx if store_idx != -1 else len(text)
        how_to_serve = text[serve_idx + len("How to Serve:"):end].strip()
    if store_idx != -1:
        how_to_store = text[store_idx + len("How to Store:"):].strip()
    return strip_icon_tail(how_to_serve), strip_icon_tail(how_to_store)


def main():
    with pdfplumber.open(PDF_PATH) as pdf:
        page_groups = []  # list of (day, label, [page indices])
        current_key = None
        for idx, page in enumerate(pdf.pages):
            text = page.extract_text() or ""
            first_lines = "\n".join(text.split("\n")[:2])
            m = DAY_HEADER_RE.search(first_lines)
            if not m:
                continue
            week = re.sub(r"\s+", "", m.group(1))
            day = int(m.group(2))
            label = m.group(3) or "Solid Foods Meal"
            key = (day, week, label)
            if page_groups and page_groups[-1][0] == key:
                page_groups[-1][1].append(idx)
            else:
                page_groups.append([key, [idx]])

        results = []  # list of dicts per recipe
        for (day, week, label), page_indices in page_groups:
            agg = None
            for i, pidx in enumerate(page_indices):
                data = extract_page(pdf.pages[pidx])
                if i == 0:
                    agg = data
                    agg["instructions_lines"] = list(data["instructions_lines"])
                    agg["serving_lines"] = list(data["serving_lines"])
                else:
                    # continuation page: only extend instructions/serving text
                    agg["instructions_lines"].extend(data["instructions_lines"])
                    agg["serving_lines"].extend(data["serving_lines"])
            how_to_serve, how_to_store = split_serving(agg["serving_lines"])
            results.append({
                "day": day,
                "week": week,
                "mealType": label,
                "title": re.sub(r"\s+", " ", " ".join(agg["title_lines"])).strip(),
                "newFoods": agg["newfoods"],
                "allergens": agg["allergens"],
                "yield": agg["yield"],
                "cookTime": agg["cook_time"],
                "ingredients": merge_bullets(agg["ingredients_lines"]),
                "instructions": strip_icon_tail(re.sub(r"\s+", " ", " ".join(agg["instructions_lines"])).strip()),
                "howToServe": how_to_serve,
                "howToStore": how_to_store,
                "pages": page_indices,
            })

        with open("materials/recipes_raw.json", "w") as f:
            json.dump(results, f, indent=2)
        print("Extracted", len(results), "recipe entries across", len(page_groups), "page groups.")


if __name__ == "__main__":
    main()
