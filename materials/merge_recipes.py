"""
Merges materials/recipes_raw.json (from extract_recipes.py) into the final
per-day plan structure used by the app, and writes it to BOTH
materials/parsed_plan.json and app/data/plan.json so the two never drift.

Canonical pipeline (run from the project root, with the project .venv):
    .venv/bin/python materials/extract_recipes.py   # PDF -> recipes_raw.json
    .venv/bin/python materials/merge_recipes.py     # recipes_raw.json -> plan.json

Titles/newFoods/allergens/week are all taken from the PDF-derived recipe data
(the earlier header-row text parsers dropped wrapped multi-line cells).
"""
import json
import shutil

RAW_PATH = "materials/recipes_raw.json"
OUT_PATH = "materials/parsed_plan.json"
APP_PATH = "app/data/plan.json"

# Known extraction glitches: where a wrapped "New Foods" cell was glued onto
# the end of a recipe title by extract_recipes.py.
TITLE_FIXES = {
    "Antipasto Salad Artichoke": "Antipasto Salad",
}

# Yield lines that are wrong in the source PDF itself (copy-paste slips:
# Day 23 shows Day 24's yield, Day 24 shows Day 20's, Day 64 says mango for
# a papaya recipe). Keyed by (day, title); values derived from each recipe's
# own ingredients and steps.
YIELD_FIXES = {
    (23, "Cauliflower Two Ways with Yogurt"): "1 c (240 ml) florets + yogurt swirl",
    (24, "Apple Swirl Yogurt"): "1 apple half + ½ c (120 ml) swirl",
    (64, "Coconut Porridge with Sesame Tahini Swirl + Papaya Two Ways"): "1 c (240 ml) porridge + 4-6 papaya spears",
}

with open(RAW_PATH) as f:
    recipes = json.load(f)
for r in recipes:
    r["title"] = TITLE_FIXES.get(r["title"], r["title"])
    r["yield"] = YIELD_FIXES.get((r["day"], r["title"]), r["yield"])

by_day = {}
for r in recipes:
    by_day.setdefault(r["day"], []).append(r)

days = []
for day in range(1, 101):
    day_recipes = sorted(by_day.get(day, []), key=lambda r: r["pages"][0])
    meals = []
    family_meal = ""
    new_foods = []
    allergens = []
    recipe_entries = []
    # Week label as printed on the day's first page. The source PDF has one
    # known typo (Day 98's second meal page says "Week 15"), so conflicts are
    # reported but resolved in favour of the first page.
    weeks = [r["week"] for r in day_recipes]
    if len(set(weeks)) > 1:
        print(f"WARNING Day {day}: conflicting week labels {weeks}; using '{weeks[0]}'")
    for r in day_recipes:
        for f in r["newFoods"]:
            if f and f != "None" and f not in new_foods:
                new_foods.append(f)
        for a in r["allergens"]:
            if a and a != "None" and a not in allergens:
                allergens.append(a)
        if r["mealType"] == "Family Meal to Share with Baby":
            family_meal = r["title"]
        else:
            meals.append(r["title"])
        recipe_entries.append({
            "mealType": r["mealType"],
            "title": r["title"],
            "yield": r["yield"],
            "cookTime": r["cookTime"],
            "ingredients": r["ingredients"],
            "instructions": r["instructions"],
            "howToServe": r["howToServe"],
            "howToStore": r["howToStore"],
        })
    days.append({
        "day": day,
        "week": weeks[0] if weeks else "",
        "meals": meals,
        "familyMeal": family_meal,
        "newFoods": new_foods,
        "allergens": allergens,
        "recipes": recipe_entries,
    })

with open(OUT_PATH, "w") as f:
    json.dump(days, f, indent=2)
shutil.copyfile(OUT_PATH, APP_PATH)

missing = [d["day"] for d in days if not d["recipes"]]
print("Days with no recipe found:", missing)
print(f"Wrote {OUT_PATH} and {APP_PATH} with {len(days)} days, {len(recipes)} recipes.")
