// Maps food names (as in data/plan.json "newFoods") to a Tracker category.
// Custom foods fall back to a keyword match ("Baked Sweet Potato" → Vegetables),
// then to "Other".
export const CATEGORY = {
  // Vegetables
  "Acorn Squash": "Vegetables", "Asparagus": "Vegetables", "Beet": "Vegetables",
  "Bell Pepper": "Vegetables", "Bok Choy": "Vegetables", "Broccoli": "Vegetables",
  "Cabbage": "Vegetables", "Carrot": "Vegetables", "Cauliflower": "Vegetables",
  "Celery": "Vegetables", "Chayote": "Vegetables", "Collard Greens": "Vegetables",
  "Corn": "Vegetables", "Cucumber": "Vegetables", "Garden Peas": "Vegetables",
  "Garlic": "Vegetables", "Green Bean": "Vegetables", "Jicama": "Vegetables",
  "Leeks": "Vegetables", "Mushroom": "Vegetables", "Nopal": "Vegetables",
  "Okra": "Vegetables", "Onion": "Vegetables", "Plantain": "Vegetables",
  "Pumpkin": "Vegetables", "Ramps": "Vegetables", "Romaine": "Vegetables",
  "Rutabaga": "Vegetables", "Snow Pea": "Vegetables", "Spaghetti Squash": "Vegetables",
  "Spinach": "Vegetables", "Sweet Potato": "Vegetables", "Taro": "Vegetables",
  "Tomato": "Vegetables", "Turnip": "Vegetables", "White Potato": "Vegetables",
  "Zucchini": "Vegetables", "Eggplant": "Vegetables", "Lettuce": "Vegetables",
  "Potato": "Vegetables", "Squash": "Vegetables", "Pepper": "Vegetables",

  // Fruit
  "Apple": "Fruit", "Asian Pear": "Fruit", "Banana": "Fruit", "Blackberry": "Fruit",
  "Blueberries": "Fruit", "Cantaloupe": "Fruit", "Fig": "Fruit", "Grapefruit": "Fruit",
  "Guava": "Fruit", "Kiwi": "Fruit", "Lemon": "Fruit", "Lime": "Fruit", "Mango": "Fruit",
  "Orange": "Fruit", "Papaya": "Fruit", "Pear": "Fruit", "Persimmon": "Fruit",
  "Pineapple": "Fruit", "Raspberry": "Fruit", "Sapodilla": "Fruit", "Star Fruit": "Fruit",
  "Strawberry": "Fruit", "Watermelon": "Fruit", "Avocado": "Fruit", "Grapes": "Fruit",
  "Cherry": "Fruit", "Peach": "Fruit", "Plum": "Fruit", "Melon": "Fruit", "Apricot": "Fruit",
  "Berry": "Fruit", "Date": "Fruit", "Prune": "Fruit", "Pomegranate": "Fruit",

  // Meat, fish & eggs
  "Chicken": "Meat, Fish & Eggs", "Chicken Liver": "Meat, Fish & Eggs", "Cod": "Meat, Fish & Eggs",
  "Egg": "Meat, Fish & Eggs", "Ground Beef": "Meat, Fish & Eggs", "Lamb": "Meat, Fish & Eggs",
  "Mackerel": "Meat, Fish & Eggs", "Pork": "Meat, Fish & Eggs", "Salmon": "Meat, Fish & Eggs",
  "Sardines": "Meat, Fish & Eggs", "Tilapia": "Meat, Fish & Eggs", "Trout": "Meat, Fish & Eggs",
  "Turkey": "Meat, Fish & Eggs", "Beef": "Meat, Fish & Eggs", "Fish": "Meat, Fish & Eggs",
  "Shrimp": "Meat, Fish & Eggs",

  // Beans & soy
  "Black Beans": "Beans & Soy", "Cannelini Beans": "Beans & Soy", "Chickpea": "Beans & Soy",
  "Edamame": "Beans & Soy", "Kidney Beans": "Beans & Soy", "Lentils": "Beans & Soy",
  "Pinto Beans": "Beans & Soy", "Tofu": "Beans & Soy", "Bean": "Beans & Soy",

  // Dairy
  "Butter": "Dairy", "Cheese": "Dairy", "Cottage Cheese": "Dairy", "Ghee": "Dairy",
  "Goat Cheese": "Dairy", "Labneh": "Dairy", "Mascarpone": "Dairy", "Mozzarella Cheese": "Dairy",
  "Queso Fresco": "Dairy", "Ricotta": "Dairy", "Sour Cream": "Dairy", "Yogurt": "Dairy",
  "Milk": "Dairy",

  // Grains & bread
  "Bread": "Grains & Bread", "Buckwheat": "Grains & Bread", "Bulgur": "Grains & Bread",
  "Corn Tortilla": "Grains & Bread", "Noodles": "Grains & Bread", "Oats": "Grains & Bread",
  "Pasta": "Grains & Bread", "Pizza": "Grains & Bread", "Quinoa": "Grains & Bread",
  "Rice": "Grains & Bread", "Wheat Farina": "Grains & Bread",

  // Nuts & seeds (coconut counts as a tree nut for allergy purposes)
  "Almond": "Nuts & Seeds", "Cashew": "Nuts & Seeds", "Coconut": "Nuts & Seeds",
  "Coconut Milk": "Nuts & Seeds", "Hazelnut": "Nuts & Seeds", "Hemp Seeds": "Nuts & Seeds",
  "Peanut": "Nuts & Seeds", "Pecan": "Nuts & Seeds", "Pumpkin Seeds": "Nuts & Seeds",
  "Sesame": "Nuts & Seeds", "Sunflower Seeds": "Nuts & Seeds", "Walnut": "Nuts & Seeds",
  "Nut": "Nuts & Seeds",

  // Herbs & spices
  "Basil": "Herbs & Spices", "Cilantro": "Herbs & Spices", "Dill": "Herbs & Spices",
  "Ginger": "Herbs & Spices", "Mint": "Herbs & Spices", "Parsley": "Herbs & Spices",
  "Rosemary": "Herbs & Spices", "Thyme": "Herbs & Spices", "Black Pepper": "Herbs & Spices",
  "Cardamom": "Herbs & Spices", "Cayenne": "Herbs & Spices", "Chipotle": "Herbs & Spices",
  "Ancho Chili": "Herbs & Spices", "Cinnamon": "Herbs & Spices", "Cumin": "Herbs & Spices",
  "Garam Masala": "Herbs & Spices", "Nutmeg": "Herbs & Spices", "Paprika": "Herbs & Spices",
  "Turmeric": "Herbs & Spices", "Vanilla Extract": "Herbs & Spices",

  // Pantry & condiments
  "Olive Oil": "Pantry & Condiments", "Vinegar": "Pantry & Condiments",
  "Kimchi": "Pantry & Condiments", "Olive": "Pantry & Condiments"
};

export const CATEGORY_ORDER = [
  "Vegetables", "Fruit", "Meat, Fish & Eggs", "Beans & Soy", "Dairy",
  "Grains & Bread", "Nuts & Seeds", "Herbs & Spices", "Pantry & Condiments", "Other"
];

export const CATEGORY_ICON = {
  "Vegetables": "🥦", "Fruit": "🍎", "Meat, Fish & Eggs": "🍗", "Beans & Soy": "🫘",
  "Dairy": "🧀", "Grains & Bread": "🍞", "Nuts & Seeds": "🥜", "Herbs & Spices": "🌿",
  "Pantry & Condiments": "🫒", "Other": "🍽️"
};

// Pantry staples assumed to already be in the kitchen (spices, oils, vinegar,
// extracts). Kept for reference; the Grocery tab now uses the PDF's own lists.
export const PANTRY_STAPLES = new Set([
  "Olive Oil", "Vinegar", "Vanilla Extract", "Black Pepper", "Cardamom",
  "Cayenne", "Chipotle", "Ancho Chili", "Cinnamon", "Cumin", "Garam Masala",
  "Nutmeg", "Paprika", "Turmeric"
]);

export function isPantryStaple(food) {
  return PANTRY_STAPLES.has(food);
}

// Longest keys first so "Sweet Potato" wins over "Potato".
const CATEGORY_KEYS = Object.keys(CATEGORY).sort((a, b) => b.length - a.length);

export function categoryFor(food) {
  if (CATEGORY[food]) return CATEGORY[food];
  const lower = food.toLowerCase();
  const hit = CATEGORY_KEYS.find((k) => lower.includes(k.toLowerCase()));
  return hit ? CATEGORY[hit] : "Other";
}

// Emoji shown next to each food in the Tracker. Foods not listed here get a
// keyword match (so a custom "Baked Apple" still shows an apple), then the
// category's icon.
export const ICON = {
  "Acorn Squash": "🎃", "Almond": "🌰", "Ancho Chili": "🌶️", "Apple": "🍎",
  "Asian Pear": "🍐", "Asparagus": "🌱", "Banana": "🍌", "Basil": "🌿",
  "Beet": "🫜", "Bell Pepper": "🫑", "Black Beans": "🫘", "Black Pepper": "🧂",
  "Blackberry": "🫐", "Blueberries": "🫐", "Bok Choy": "🥬", "Bread": "🍞",
  "Broccoli": "🥦", "Buckwheat": "🌾", "Bulgur": "🌾", "Butter": "🧈",
  "Cabbage": "🥬", "Cannelini Beans": "🫘", "Cantaloupe": "🍈", "Cardamom": "🌿",
  "Carrot": "🥕", "Cashew": "🥜", "Cauliflower": "🥦", "Cayenne": "🌶️",
  "Celery": "🥬", "Chayote": "🥒", "Chicken": "🍗", "Chicken Liver": "🍗",
  "Chickpea": "🫘", "Chipotle": "🌶️", "Cilantro": "🌿", "Cinnamon": "🪵",
  "Coconut": "🥥", "Coconut Milk": "🥥", "Cod": "🐟", "Collard Greens": "🥬",
  "Corn": "🌽", "Corn Tortilla": "🌮", "Cottage Cheese": "🧀", "Cucumber": "🥒",
  "Cumin": "🧂", "Dill": "🌿", "Edamame": "🫛", "Egg": "🥚", "Fig": "🍇",
  "Garam Masala": "🧂", "Garden Peas": "🫛", "Garlic": "🧄", "Ghee": "🧈",
  "Ginger": "🫚", "Goat Cheese": "🧀", "Grapefruit": "🍊", "Green Bean": "🫛",
  "Ground Beef": "🥩", "Guava": "🍈", "Hazelnut": "🌰", "Hemp Seeds": "🌱",
  "Jicama": "🥔", "Kidney Beans": "🫘", "Kimchi": "🥬", "Kiwi": "🥝",
  "Labneh": "🥛", "Lamb": "🍖", "Leeks": "🧅", "Lemon": "🍋", "Lentils": "🫘",
  "Lime": "🍋", "Mackerel": "🐟", "Mango": "🥭", "Mascarpone": "🧀",
  "Mint": "🌿", "Mozzarella Cheese": "🧀", "Mushroom": "🍄", "Noodles": "🍜",
  "Nopal": "🌵", "Nutmeg": "🧂", "Oats": "🥣", "Okra": "🌱", "Olive Oil": "🫒",
  "Onion": "🧅", "Orange": "🍊", "Papaya": "🍈", "Paprika": "🌶️",
  "Parsley": "🌿", "Pasta": "🍝", "Peanut": "🥜", "Pear": "🍐", "Pecan": "🌰",
  "Persimmon": "🟠", "Pineapple": "🍍", "Pinto Beans": "🫘", "Pizza": "🍕",
  "Plantain": "🍌", "Pork": "🥓", "Pumpkin": "🎃", "Pumpkin Seeds": "🌱",
  "Queso Fresco": "🧀", "Quinoa": "🌾", "Ramps": "🧅", "Raspberry": "🍓",
  "Rice": "🍚", "Ricotta": "🧀", "Romaine": "🥬", "Rosemary": "🌿",
  "Rutabaga": "🥔", "Salmon": "🐟", "Sapodilla": "🟤", "Sardines": "🐟",
  "Sesame": "🌱", "Snow Pea": "🫛", "Sour Cream": "🥛", "Spaghetti Squash": "🎃",
  "Spinach": "🥬", "Star Fruit": "⭐", "Strawberry": "🍓", "Sunflower Seeds": "🌻",
  "Sweet Potato": "🍠", "Taro": "🥔", "Thyme": "🌿", "Tilapia": "🐟",
  "Tofu": "⬜", "Tomato": "🍅", "Trout": "🐟", "Turkey": "🦃", "Turmeric": "🧂",
  "Turnip": "🫜", "Vanilla Extract": "🍶", "Vinegar": "🍶", "Walnut": "🌰",
  "Watermelon": "🍉", "Wheat Farina": "🌾", "White Potato": "🥔", "Yogurt": "🥛",
  "Zucchini": "🥒",
  // Common custom additions
  "Avocado": "🥑", "Grapes": "🍇", "Cherry": "🍒", "Peach": "🍑", "Plum": "🫐",
  "Melon": "🍈", "Eggplant": "🍆", "Shrimp": "🦐", "Beef": "🥩", "Milk": "🥛",
  "Cheese": "🧀", "Fish": "🐟", "Potato": "🥔", "Olive": "🫒", "Pepper": "🫑",
  "Bean": "🫘", "Nut": "🌰", "Berry": "🫐", "Lettuce": "🥬", "Honeydew": "🍈",
  "Date": "🟤", "Prune": "🫐", "Apricot": "🍑", "Pomegranate": "🔴"
};

// Longest keys first so "Sweet Potato" wins over "Potato" in keyword matching.
const ICON_KEYS = Object.keys(ICON).sort((a, b) => b.length - a.length);

export function iconFor(food) {
  if (ICON[food]) return ICON[food];
  const lower = food.toLowerCase();
  const hit = ICON_KEYS.find((k) => lower.includes(k.toLowerCase()));
  if (hit) return ICON[hit];
  return CATEGORY_ICON[categoryFor(food)];
}

// Common allergen groups as the plan labels them. Foods not listed are not
// allergens; custom foods get a keyword match ("Scrambled Egg" → Egg).
export const ALLERGEN = {
  "Egg": "Egg",
  "Peanut": "Peanut",
  "Butter": "Dairy", "Cheese": "Dairy", "Cottage Cheese": "Dairy", "Ghee": "Dairy",
  "Goat Cheese": "Dairy", "Labneh": "Dairy", "Mascarpone": "Dairy", "Mozzarella Cheese": "Dairy",
  "Queso Fresco": "Dairy", "Ricotta": "Dairy", "Sour Cream": "Dairy", "Yogurt": "Dairy", "Milk": "Dairy",
  "Bread": "Wheat", "Bulgur": "Wheat", "Noodles": "Wheat", "Pasta": "Wheat", "Pizza": "Wheat",
  "Wheat Farina": "Wheat", "Wheat": "Wheat",
  "Sesame": "Sesame",
  "Edamame": "Soy", "Tofu": "Soy", "Soy": "Soy",
  "Coconut": "Coconut", "Coconut Milk": "Coconut",
  "Cod": "Finned Fish", "Mackerel": "Finned Fish", "Salmon": "Finned Fish", "Sardines": "Finned Fish",
  "Tilapia": "Finned Fish", "Trout": "Finned Fish", "Fish": "Finned Fish",
  "Almond": "Tree Nut", "Cashew": "Tree Nut", "Hazelnut": "Tree Nut", "Pecan": "Tree Nut",
  "Walnut": "Tree Nut", "Nut": "Tree Nut"
};

export const ALLERGEN_ORDER = ["Egg", "Peanut", "Dairy", "Wheat", "Sesame", "Soy", "Coconut", "Finned Fish", "Tree Nut"];

const ALLERGEN_KEYS = Object.keys(ALLERGEN).sort((a, b) => b.length - a.length);

// Returns the allergen group for a food, or null if it is not a common allergen.
export function allergenFor(food) {
  if (ALLERGEN[food]) return ALLERGEN[food];
  const lower = food.toLowerCase();
  const hit = ALLERGEN_KEYS.find((k) => lower.includes(k.toLowerCase()));
  return hit ? ALLERGEN[hit] : null;
}

// Extra spellings used in recipe ingredient lines, so a tracker food can be
// recognised in a day's recipes ("dry instant oatmeal" → Oats).
export const FOOD_ALIASES = {
  "Oats": ["oatmeal", "rolled oats"], "Egg": ["eggs"], "Sesame": ["tahini", "sesame seeds", "sesame oil"],
  "Chickpea": ["chickpeas", "hummus"], "Cannelini Beans": ["cannellini beans", "cannellini"],
  "Peanut": ["peanut butter", "peanuts"], "Almond": ["almond butter", "almond flour", "almonds"],
  "Cashew": ["cashew butter", "cashews"], "Walnut": ["walnuts"], "Pecan": ["pecans"], "Hazelnut": ["hazelnuts"],
  "Wheat Farina": ["farina"], "Bread": ["toast", "breadcrumbs", "wheat bread"], "Pasta": ["penne", "spaghetti", "macaroni", "fusilli"],
  "Noodles": ["egg noodles"], "Cheese": ["parmesan", "cheddar"], "Ground Beef": ["beef"], "Chicken": ["chicken breast", "drumstick", "chicken thigh"],
  "Chicken Liver": ["chicken livers", "liver"], "White Potato": ["russet potato", "potato", "potatoes", "baby potatoes"],
  "Sweet Potato": ["sweet potatoes", "yam"], "Garden Peas": ["peas"], "Green Bean": ["green beans"], "Snow Pea": ["snow peas"],
  "Blueberries": ["blueberry"], "Strawberry": ["strawberries"], "Raspberry": ["raspberries"], "Blackberry": ["blackberries"],
  "Tomato": ["tomatoes", "tomato sauce"], "Coconut": ["coconut flakes", "desiccated coconut"], "Coconut Milk": [],
  "Yogurt": ["yoghurt"], "Bell Pepper": ["bell peppers", "sweet pepper"], "Black Beans": ["black bean"], "Kidney Beans": ["kidney bean"],
  "Pinto Beans": ["pinto bean"], "Lentils": ["lentil"], "Mushroom": ["mushrooms", "portobello"], "Onion": ["onions", "shallot", "green onion"],
  "Garlic": ["garlic powder"], "Lemon": ["lemons", "lemon juice"], "Lime": ["limes", "lime juice"], "Corn": ["corn on the cob", "corn kernels"],
  "Corn Tortilla": ["corn tortillas"], "Pumpkin": ["pumpkin purée", "pumpkin puree"], "Pumpkin Seeds": ["pumpkin seed"],
  "Sunflower Seeds": ["sunflower seed"], "Hemp Seeds": ["hemp seed", "hemp hearts"], "Olive Oil": [], "Butter": ["unsalted butter"],
  "Fig": ["figs"], "Apple": ["apples", "applesauce"], "Pear": ["pears"], "Banana": ["bananas"], "Mango": ["mangos", "mangoes"],
  "Kiwi": ["kiwis"], "Orange": ["oranges"], "Carrot": ["carrots"], "Zucchini": ["zucchinis", "courgette"], "Cucumber": ["cucumbers"],
  "Asparagus": ["asparagus spears"], "Beet": ["beets", "beetroot"], "Turnip": ["turnips"], "Leeks": ["leek"], "Cabbage": ["kimchi"] 
};

const WORD = "[a-z0-9]";
function escapeRegExp(str) { return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

// Returns the known foods whose name (or alias) appears in the given recipe
// ingredient lines. Longer names are matched first and blanked out, so
// "corn tortillas" counts as Corn Tortilla, not Corn.
export function foodsInIngredients(lines, knownFoods) {
  let text = " " + lines.join(" \n ").toLowerCase() + " ";
  const terms = [];
  knownFoods.forEach((food) => {
    const names = [food, ...(FOOD_ALIASES[food] || [])];
    names.forEach((n) => terms.push({ food, term: n.toLowerCase() }));
  });
  terms.sort((a, b) => b.term.length - a.term.length);
  const found = new Set();
  terms.forEach(({ food, term }) => {
    const re = new RegExp(`(?<!${WORD})${escapeRegExp(term)}(?:s|es)?(?!${WORD})`, "g");
    if (re.test(text)) {
      found.add(food);
      text = text.replace(re, (m) => " ".repeat(m.length));
    }
  });
  return Array.from(found);
}
