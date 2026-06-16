// A real (if compact) nutrition database. Values are per the stated serving and
// are reasonable real-world figures. Search is substring + category. This stands
// in for a remote nutrition API; lib/api.ts could later proxy one instead.

export type Food = {
  id: string
  name: string
  emoji: string
  category: 'Protein' | 'Carbs' | 'Veg' | 'Fruit' | 'Dairy' | 'Snack' | 'Drink' | 'Meal'
  serving: string
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export const FOODS: Food[] = [
  // Protein
  { id: 'chicken-breast', name: 'Grilled chicken breast', emoji: '🍗', category: 'Protein', serving: '150g', kcal: 240, protein: 45, carbs: 0, fat: 5 },
  { id: 'salmon', name: 'Salmon fillet', emoji: '🐟', category: 'Protein', serving: '150g', kcal: 280, protein: 39, carbs: 0, fat: 13 },
  { id: 'beef-mince', name: 'Lean beef mince', emoji: '🥩', category: 'Protein', serving: '120g', kcal: 250, protein: 26, carbs: 0, fat: 16 },
  { id: 'eggs', name: 'Eggs', emoji: '🥚', category: 'Protein', serving: '2 large', kcal: 156, protein: 13, carbs: 1, fat: 11 },
  { id: 'tofu', name: 'Firm tofu', emoji: '🧊', category: 'Protein', serving: '150g', kcal: 175, protein: 18, carbs: 4, fat: 11 },
  { id: 'tuna', name: 'Tuna (canned)', emoji: '🐟', category: 'Protein', serving: '1 can', kcal: 120, protein: 26, carbs: 0, fat: 1 },
  { id: 'shrimp', name: 'Shrimp', emoji: '🦐', category: 'Protein', serving: '120g', kcal: 100, protein: 24, carbs: 0, fat: 1 },
  { id: 'turkey', name: 'Turkey breast', emoji: '🦃', category: 'Protein', serving: '120g', kcal: 160, protein: 34, carbs: 0, fat: 2 },
  { id: 'pork-chop', name: 'Pork chop', emoji: '🥩', category: 'Protein', serving: '150g', kcal: 290, protein: 39, carbs: 0, fat: 14 },
  { id: 'lentils', name: 'Lentils (cooked)', emoji: '🫘', category: 'Protein', serving: '1 cup', kcal: 230, protein: 18, carbs: 40, fat: 1 },
  { id: 'chickpeas', name: 'Chickpeas', emoji: '🫛', category: 'Protein', serving: '1 cup', kcal: 270, protein: 15, carbs: 45, fat: 4 },
  { id: 'protein-shake', name: 'Protein shake', emoji: '🥤', category: 'Protein', serving: '1 scoop', kcal: 130, protein: 25, carbs: 4, fat: 2 },

  // Carbs
  { id: 'jasmine-rice', name: 'Jasmine rice (cooked)', emoji: '🍚', category: 'Carbs', serving: '1 cup', kcal: 205, protein: 4, carbs: 45, fat: 0 },
  { id: 'brown-rice', name: 'Brown rice (cooked)', emoji: '🍚', category: 'Carbs', serving: '1 cup', kcal: 215, protein: 5, carbs: 45, fat: 2 },
  { id: 'pasta', name: 'Pasta (cooked)', emoji: '🍝', category: 'Carbs', serving: '1 cup', kcal: 220, protein: 8, carbs: 43, fat: 1 },
  { id: 'bread', name: 'Whole-grain bread', emoji: '🍞', category: 'Carbs', serving: '2 slices', kcal: 160, protein: 8, carbs: 28, fat: 2 },
  { id: 'bagel', name: 'Bagel', emoji: '🥯', category: 'Carbs', serving: '1 bagel', kcal: 250, protein: 10, carbs: 49, fat: 2 },
  { id: 'oats', name: 'Oatmeal', emoji: '🥣', category: 'Carbs', serving: '1 cup', kcal: 150, protein: 5, carbs: 27, fat: 3 },
  { id: 'potato', name: 'Baked potato', emoji: '🥔', category: 'Carbs', serving: '1 medium', kcal: 160, protein: 4, carbs: 37, fat: 0 },
  { id: 'sweet-potato', name: 'Sweet potato', emoji: '🍠', category: 'Carbs', serving: '1 medium', kcal: 115, protein: 2, carbs: 27, fat: 0 },
  { id: 'quinoa', name: 'Quinoa (cooked)', emoji: '🍚', category: 'Carbs', serving: '1 cup', kcal: 220, protein: 8, carbs: 39, fat: 4 },
  { id: 'tortilla', name: 'Flour tortilla', emoji: '🫓', category: 'Carbs', serving: '1 large', kcal: 150, protein: 4, carbs: 26, fat: 4 },
  { id: 'noodles', name: 'Egg noodles', emoji: '🍜', category: 'Carbs', serving: '1 cup', kcal: 220, protein: 7, carbs: 40, fat: 3 },
  { id: 'pancakes', name: 'Pancakes', emoji: '🥞', category: 'Carbs', serving: '3 small', kcal: 260, protein: 7, carbs: 41, fat: 8 },

  // Veg
  { id: 'broccoli', name: 'Broccoli', emoji: '🥦', category: 'Veg', serving: '1 cup', kcal: 55, protein: 4, carbs: 11, fat: 1 },
  { id: 'spinach', name: 'Spinach', emoji: '🥬', category: 'Veg', serving: '2 cups', kcal: 40, protein: 3, carbs: 6, fat: 0 },
  { id: 'mixed-salad', name: 'Mixed salad', emoji: '🥗', category: 'Veg', serving: '1 bowl', kcal: 90, protein: 3, carbs: 9, fat: 5 },
  { id: 'avocado', name: 'Avocado', emoji: '🥑', category: 'Veg', serving: '1/2', kcal: 160, protein: 2, carbs: 9, fat: 15 },
  { id: 'carrots', name: 'Carrots', emoji: '🥕', category: 'Veg', serving: '1 cup', kcal: 50, protein: 1, carbs: 12, fat: 0 },
  { id: 'tomato', name: 'Tomato', emoji: '🍅', category: 'Veg', serving: '1 medium', kcal: 22, protein: 1, carbs: 5, fat: 0 },
  { id: 'corn', name: 'Sweetcorn', emoji: '🌽', category: 'Veg', serving: '1 cup', kcal: 130, protein: 5, carbs: 29, fat: 2 },
  { id: 'peppers', name: 'Bell peppers', emoji: '🫑', category: 'Veg', serving: '1 cup', kcal: 40, protein: 1, carbs: 9, fat: 0 },
  { id: 'mushrooms', name: 'Mushrooms', emoji: '🍄', category: 'Veg', serving: '1 cup', kcal: 22, protein: 3, carbs: 3, fat: 0 },
  { id: 'cucumber', name: 'Cucumber', emoji: '🥒', category: 'Veg', serving: '1 cup', kcal: 16, protein: 1, carbs: 4, fat: 0 },

  // Fruit
  { id: 'banana', name: 'Banana', emoji: '🍌', category: 'Fruit', serving: '1 medium', kcal: 105, protein: 1, carbs: 27, fat: 0 },
  { id: 'apple', name: 'Apple', emoji: '🍎', category: 'Fruit', serving: '1 medium', kcal: 95, protein: 0, carbs: 25, fat: 0 },
  { id: 'berries', name: 'Mixed berries', emoji: '🫐', category: 'Fruit', serving: '1 cup', kcal: 70, protein: 1, carbs: 17, fat: 0 },
  { id: 'orange', name: 'Orange', emoji: '🍊', category: 'Fruit', serving: '1 medium', kcal: 62, protein: 1, carbs: 15, fat: 0 },
  { id: 'grapes', name: 'Grapes', emoji: '🍇', category: 'Fruit', serving: '1 cup', kcal: 104, protein: 1, carbs: 27, fat: 0 },
  { id: 'mango', name: 'Mango', emoji: '🥭', category: 'Fruit', serving: '1 cup', kcal: 99, protein: 1, carbs: 25, fat: 1 },
  { id: 'strawberries', name: 'Strawberries', emoji: '🍓', category: 'Fruit', serving: '1 cup', kcal: 49, protein: 1, carbs: 12, fat: 0 },
  { id: 'watermelon', name: 'Watermelon', emoji: '🍉', category: 'Fruit', serving: '1 cup', kcal: 46, protein: 1, carbs: 12, fat: 0 },
  { id: 'pineapple', name: 'Pineapple', emoji: '🍍', category: 'Fruit', serving: '1 cup', kcal: 82, protein: 1, carbs: 22, fat: 0 },

  // Dairy
  { id: 'greek-yogurt', name: 'Greek yogurt', emoji: '🥛', category: 'Dairy', serving: '170g', kcal: 100, protein: 17, carbs: 6, fat: 1 },
  { id: 'milk', name: 'Milk', emoji: '🥛', category: 'Dairy', serving: '1 cup', kcal: 120, protein: 8, carbs: 12, fat: 5 },
  { id: 'cheddar', name: 'Cheddar cheese', emoji: '🧀', category: 'Dairy', serving: '30g', kcal: 115, protein: 7, carbs: 1, fat: 9 },
  { id: 'cottage-cheese', name: 'Cottage cheese', emoji: '🧀', category: 'Dairy', serving: '1/2 cup', kcal: 110, protein: 12, carbs: 5, fat: 5 },
  { id: 'butter', name: 'Butter', emoji: '🧈', category: 'Dairy', serving: '1 tbsp', kcal: 100, protein: 0, carbs: 0, fat: 11 },

  // Snack
  { id: 'almonds', name: 'Almonds', emoji: '🥜', category: 'Snack', serving: '28g', kcal: 165, protein: 6, carbs: 6, fat: 14 },
  { id: 'peanut-butter', name: 'Peanut butter', emoji: '🥜', category: 'Snack', serving: '2 tbsp', kcal: 190, protein: 8, carbs: 6, fat: 16 },
  { id: 'dark-chocolate', name: 'Dark chocolate', emoji: '🍫', category: 'Snack', serving: '30g', kcal: 170, protein: 2, carbs: 13, fat: 12 },
  { id: 'chips', name: 'Potato chips', emoji: '🍟', category: 'Snack', serving: '1 bag', kcal: 150, protein: 2, carbs: 15, fat: 10 },
  { id: 'popcorn', name: 'Popcorn', emoji: '🍿', category: 'Snack', serving: '3 cups', kcal: 100, protein: 3, carbs: 20, fat: 1 },
  { id: 'granola-bar', name: 'Granola bar', emoji: '🍫', category: 'Snack', serving: '1 bar', kcal: 130, protein: 3, carbs: 18, fat: 5 },
  { id: 'cookies', name: 'Cookies', emoji: '🍪', category: 'Snack', serving: '2 cookies', kcal: 160, protein: 2, carbs: 22, fat: 8 },
  { id: 'hummus', name: 'Hummus', emoji: '🫛', category: 'Snack', serving: '1/4 cup', kcal: 100, protein: 4, carbs: 9, fat: 6 },
  { id: 'trail-mix', name: 'Trail mix', emoji: '🥜', category: 'Snack', serving: '1/4 cup', kcal: 175, protein: 5, carbs: 16, fat: 11 },

  // Drink
  { id: 'coffee', name: 'Coffee (black)', emoji: '☕', category: 'Drink', serving: '1 cup', kcal: 5, protein: 0, carbs: 1, fat: 0 },
  { id: 'latte', name: 'Latte', emoji: '☕', category: 'Drink', serving: '1 medium', kcal: 150, protein: 8, carbs: 15, fat: 6 },
  { id: 'orange-juice', name: 'Orange juice', emoji: '🧃', category: 'Drink', serving: '1 cup', kcal: 110, protein: 2, carbs: 26, fat: 0 },
  { id: 'smoothie', name: 'Fruit smoothie', emoji: '🥤', category: 'Drink', serving: '1 medium', kcal: 210, protein: 5, carbs: 44, fat: 2 },
  { id: 'soda', name: 'Soda', emoji: '🥤', category: 'Drink', serving: '1 can', kcal: 140, protein: 0, carbs: 39, fat: 0 },
  { id: 'beer', name: 'Beer', emoji: '🍺', category: 'Drink', serving: '1 can', kcal: 153, protein: 2, carbs: 13, fat: 0 },
  { id: 'wine', name: 'Wine', emoji: '🍷', category: 'Drink', serving: '1 glass', kcal: 125, protein: 0, carbs: 4, fat: 0 },
  { id: 'water', name: 'Water', emoji: '💧', category: 'Drink', serving: '1 glass', kcal: 0, protein: 0, carbs: 0, fat: 0 },

  // Meal (composite)
  { id: 'burger', name: 'Cheeseburger', emoji: '🍔', category: 'Meal', serving: '1 burger', kcal: 540, protein: 28, carbs: 42, fat: 28 },
  { id: 'pizza', name: 'Pizza', emoji: '🍕', category: 'Meal', serving: '2 slices', kcal: 570, protein: 24, carbs: 64, fat: 22 },
  { id: 'sushi', name: 'Sushi roll', emoji: '🍣', category: 'Meal', serving: '8 pieces', kcal: 350, protein: 14, carbs: 60, fat: 6 },
  { id: 'burrito', name: 'Burrito', emoji: '🌯', category: 'Meal', serving: '1 burrito', kcal: 620, protein: 26, carbs: 74, fat: 24 },
  { id: 'taco', name: 'Tacos', emoji: '🌮', category: 'Meal', serving: '2 tacos', kcal: 340, protein: 18, carbs: 32, fat: 16 },
  { id: 'ramen', name: 'Ramen', emoji: '🍜', category: 'Meal', serving: '1 bowl', kcal: 450, protein: 18, carbs: 60, fat: 14 },
  { id: 'sandwich', name: 'Chicken sandwich', emoji: '🥪', category: 'Meal', serving: '1 sandwich', kcal: 430, protein: 30, carbs: 40, fat: 16 },
  { id: 'curry', name: 'Chicken curry', emoji: '🍛', category: 'Meal', serving: '1 bowl', kcal: 490, protein: 28, carbs: 38, fat: 24 },
  { id: 'stirfry', name: 'Veggie stir-fry', emoji: '🥡', category: 'Meal', serving: '1 bowl', kcal: 380, protein: 14, carbs: 48, fat: 14 },
  { id: 'omelette', name: 'Omelette', emoji: '🍳', category: 'Meal', serving: '3 eggs', kcal: 330, protein: 21, carbs: 4, fat: 25 },
  { id: 'fries', name: 'French fries', emoji: '🍟', category: 'Meal', serving: '1 medium', kcal: 365, protein: 4, carbs: 48, fat: 17 },
  { id: 'hot-dog', name: 'Hot dog', emoji: '🌭', category: 'Meal', serving: '1 hot dog', kcal: 290, protein: 10, carbs: 23, fat: 17 },
]

export const FOOD_BY_ID: Record<string, Food> = Object.fromEntries(FOODS.map((f) => [f.id, f]))

export function searchFoods(query: string, limit = 30): Food[] {
  const q = query.trim().toLowerCase()
  if (!q) return FOODS.slice(0, limit)
  const starts: Food[] = []
  const contains: Food[] = []
  for (const f of FOODS) {
    const n = f.name.toLowerCase()
    if (n.startsWith(q)) starts.push(f)
    else if (n.includes(q) || f.category.toLowerCase().includes(q)) contains.push(f)
  }
  return [...starts, ...contains].slice(0, limit)
}

export const QUICK_ADD_IDS = ['eggs', 'oats', 'banana', 'greek-yogurt', 'chicken-breast', 'coffee', 'salmon', 'mixed-salad']
