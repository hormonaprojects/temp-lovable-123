
import { IngredientCard } from "./IngredientCard";

interface IngredientsGridProps {
  ingredients: string[];
  categoryName: string;
  getPreferenceForIngredient: (ingredient: string) => 'like' | 'dislike' | 'neutral';
  onPreferenceChange: (ingredient: string, preference: 'like' | 'dislike' | 'neutral') => void;
}

export function IngredientsGrid({ 
  ingredients, 
  categoryName, 
  getPreferenceForIngredient, 
  onPreferenceChange 
}: IngredientsGridProps) {
  if (ingredients.length === 0) {
    return (
      <div className="text-center mb-8 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
        <p className="text-yellow-800 font-medium">
          Nincsenek alapanyagok betöltve ehhez a kategóriához: {categoryName}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
      {ingredients.map((ingredient, index) => (
        <IngredientCard
          key={ingredient}
          ingredient={ingredient}
          preference={getPreferenceForIngredient(ingredient)}
          index={index}
          onPreferenceChange={onPreferenceChange}
        />
      ))}
    </div>
  );
}
