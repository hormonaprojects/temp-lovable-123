
export interface Recipe {
  név: string;
  hozzávalók: string[];
  elkészítés: string;
  elkészítésiIdő?: string;
  fehérje?: string;
  szénhidrát?: string;
  zsír?: string;
  képUrl?: string;
  kategória?: string;
  típus?: string;
}

export interface MealPlan {
  [mealType: string]: {
    mealType: string;
    recipe: Recipe | null;
    error?: string;
  };
}

export interface FoodData {
  mealTypes: {
    [key: string]: {
      categories: {
        [key: string]: string[];
      };
    };
  };
}
