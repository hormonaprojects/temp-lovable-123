
export interface DailyMeal {
  id: string;
  user_id: string;
  date: string;
  meal_type: string;
  recipe_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  instructions: string;
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  image_url?: string;
  category?: string;
  meal_types?: string[];
}
