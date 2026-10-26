// Maps ingredient names (as they appear in data/plan.json "newFoods") to a
// grocery-list category. Anything not listed falls back to "Other" at runtime.
export const CATEGORY = {
  // Produce (vegetables, fruit, fresh herbs)
  "Acorn Squash": "Produce", "Apple": "Produce", "Asian Pear": "Produce",
  "Asparagus": "Produce", "Banana": "Produce", "Basil": "Produce",
  "Beet": "Produce", "Bell Pepper": "Produce", "Blackberry": "Produce",
  "Blueberries": "Produce", "Bok Choy": "Produce", "Broccoli": "Produce",
  "Cabbage": "Produce", "Cantaloupe": "Produce", "Carrot": "Produce",
  "Cauliflower": "Produce", "Celery": "Produce", "Chayote": "Produce",
  "Cilantro": "Produce", "Collard Greens": "Produce", "Corn": "Produce",
  "Cucumber": "Produce", "Dill": "Produce", "Fig": "Produce",
  "Garden Peas": "Produce", "Garlic": "Produce", "Ginger": "Produce",
  "Grapefruit": "Produce", "Green Bean": "Produce", "Guava": "Produce",
  "Jicama": "Produce",
  "Kiwi": "Produce", "Leeks": "Produce", "Lemon": "Produce", "Lime": "Produce",
  "Mango": "Produce", "Mint": "Produce", "Mushroom": "Produce",
  "Nopal": "Produce", "Okra": "Produce", "Onion": "Produce",
  "Orange": "Produce", "Papaya": "Produce", "Parsley": "Produce",
  "Pear": "Produce", "Persimmon": "Produce", "Pineapple": "Produce",
  "Plantain": "Produce", "Pumpkin": "Produce", "Ramps": "Produce",
  "Raspberry": "Produce", "Romaine": "Produce", "Rosemary": "Produce",
  "Rutabaga": "Produce", "Sapodilla": "Produce", "Snow Pea": "Produce",
  "Spaghetti Squash": "Produce",
  "Spinach": "Produce", "Star Fruit": "Produce", "Strawberry": "Produce",
  "Sweet Potato": "Produce", "Taro": "Produce", "Thyme": "Produce",
  "Tomato": "Produce", "Turnip": "Produce", "Watermelon": "Produce",
  "White Potato": "Produce", "Zucchini": "Produce",

  // Protein (meat, fish, eggs, legumes, tofu)
  "Black Beans": "Protein", "Cannelini Beans": "Protein", "Chicken": "Protein",
  "Chicken Liver": "Protein", "Chickpea": "Protein", "Cod": "Protein",
  "Edamame": "Protein", "Egg": "Protein", "Ground Beef": "Protein",
  "Kidney Beans": "Protein", "Lamb": "Protein", "Lentils": "Protein",
  "Mackerel": "Protein", "Pinto Beans": "Protein", "Pork": "Protein",
  "Salmon": "Protein", "Sardines": "Protein", "Tilapia": "Protein",
  "Tofu": "Protein", "Trout": "Protein", "Turkey": "Protein",

  // Dairy
  "Butter": "Dairy", "Cheese": "Dairy", "Cottage Cheese": "Dairy",
  "Ghee": "Dairy", "Goat Cheese": "Dairy", "Labneh": "Dairy", "Mascarpone": "Dairy",
  "Mozzarella Cheese": "Dairy", "Queso Fresco": "Dairy", "Ricotta": "Dairy",
  "Sour Cream": "Dairy", "Yogurt": "Dairy",

  // Nuts & seeds
  "Almond": "Nuts & Seeds", "Cashew": "Nuts & Seeds",
  "Hazelnut": "Nuts & Seeds", "Hemp Seeds": "Nuts & Seeds",
  "Peanut": "Nuts & Seeds", "Pecan": "Nuts & Seeds",
  "Pumpkin Seeds": "Nuts & Seeds", "Sesame": "Nuts & Seeds",
  "Sunflower Seeds": "Nuts & Seeds", "Walnut": "Nuts & Seeds",

  // Grains & pantry (grains, starches, oils, spices, condiments)
  "Bread": "Grains & Pantry", "Buckwheat": "Grains & Pantry",
  "Bulgur": "Grains & Pantry", "Corn Tortilla": "Grains & Pantry",
  "Noodles": "Grains & Pantry", "Oats": "Grains & Pantry",
  "Pasta": "Grains & Pantry", "Quinoa": "Grains & Pantry",
  "Rice": "Grains & Pantry", "Wheat Farina": "Grains & Pantry",
  "Olive Oil": "Grains & Pantry", "Vinegar": "Grains & Pantry",
  "Vanilla Extract": "Grains & Pantry", "Coconut": "Grains & Pantry",
  "Coconut Milk": "Grains & Pantry", "Kimchi": "Grains & Pantry",
  "Black Pepper": "Grains & Pantry", "Cardamom": "Grains & Pantry",
  "Cayenne": "Grains & Pantry", "Chipotle": "Grains & Pantry",
  "Ancho Chili": "Grains & Pantry", "Cinnamon": "Grains & Pantry",
  "Cumin": "Grains & Pantry", "Garam Masala": "Grains & Pantry",
  "Nutmeg": "Grains & Pantry", "Paprika": "Grains & Pantry",
  "Turmeric": "Grains & Pantry",

  // Other (prepared dishes / not raw groceries)
  "Pizza": "Other"
};

export const CATEGORY_ORDER = ["Produce", "Protein", "Dairy", "Grains & Pantry", "Nuts & Seeds", "Other"];

// Pantry staples assumed to already be in the kitchen (spices, oils, vinegar,
// extracts). They stay in the Tracker as foods to introduce, but are left off
// the weekly Grocery checklist so it only lists things that need buying.
export const PANTRY_STAPLES = new Set([
  "Olive Oil", "Vinegar", "Vanilla Extract", "Black Pepper", "Cardamom",
  "Cayenne", "Chipotle", "Ancho Chili", "Cinnamon", "Cumin", "Garam Masala",
  "Nutmeg", "Paprika", "Turmeric"
]);

export function isPantryStaple(food) {
  return PANTRY_STAPLES.has(food);
}

export function categoryFor(food) {
  return CATEGORY[food] || "Other";
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

const CATEGORY_ICON = {
  "Produce": "🥬", "Protein": "🍖", "Dairy": "🥛", "Grains & Pantry": "🌾",
  "Nuts & Seeds": "🥜", "Other": "🍽️"
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
