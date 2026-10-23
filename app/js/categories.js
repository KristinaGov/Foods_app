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
