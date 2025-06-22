
import { IngredientCard } from "./IngredientCard";
import { sortIngredientsByPreference } from "@/services/ingredientSorting";

interface IngredientsGridProps {
  ingredients: string[];
  categoryName: string;
  getPreferenceForIngredient: (ingredient: string) => 'like' | 'dislike' | 'neutral';
  getFavoriteForIngredient: (ingredient: string) => boolean;
  onPreferenceChange: (ingredient: string, preference: 'like' | 'dislike' | 'neutral') => void;
  onFavoriteChange: (ingredient: string, isFavorite: boolean) => void;
}

export function IngredientsGrid({ 
  ingredients, 
  categoryName, 
  getPreferenceForIngredient,
  getFavoriteForIngredient,
  onPreferenceChange,
  onFavoriteChange
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

  // Centralizált sorrendezés használata
  const sortedIngredients = sortIngredientsByPreference(
    ingredients,
    (ingredient) => getFavoriteForIngredient(ingredient),
    (ingredient) => getPreferenceForIngredient(ingredient)
  );

  console.log(`🎯 IngredientsGrid - Végső sorrendezett lista (${categoryName}):`, sortedIngredients);

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 mb-8">
      {sortedIngredients.map((ingredient, index) => (
        <IngredientCard
          key={ingredient}
          ingredient={ingredient}
          preference={getPreferenceForIngredient(ingredient)}
          favorite={getFavoriteForIngredient(ingredient)}
          index={index}
          onPreferenceChange={onPreferenceChange}
          onFavoriteChange={onFavoriteChange}
        />
      ))}
    </div>
  );
}
