
import { IngredientCard } from "./IngredientCard";
import { sortIngredientsByPreference } from "@/services/ingredientSorting";

interface IngredientsGridProps {
  ingredients: string[];
  categoryName: string;
  getPreferenceForIngredient: (ingredient: string) => 'like' | 'dislike' | 'neutral';
  getFavoriteForIngredient: (ingredient: string) => boolean;
  onPreferenceChange: (ingredient: string, preference: 'like' | 'dislike' | 'neutral') => void;
  onFavoriteChange: (ingredient: string, isFavorite: boolean) => void;
  hideDisliked?: boolean;
}

export function IngredientsGrid({
  ingredients,
  categoryName,
  getPreferenceForIngredient,
  getFavoriteForIngredient,
  onPreferenceChange,
  onFavoriteChange,
  hideDisliked = true
}: IngredientsGridProps) {
  const getSortedIngredients = () => {
    if (!hideDisliked) {
      return [...ingredients].sort((a, b) => {
        const aIsFavorite = getFavoriteForIngredient(a);
        const bIsFavorite = getFavoriteForIngredient(b);
        const aPreference = getPreferenceForIngredient(a);
        const bPreference = getPreferenceForIngredient(b);
        
        if (aIsFavorite !== bIsFavorite) {
          return aIsFavorite ? -1 : 1;
        }
        
        if (aPreference === 'like' && bPreference !== 'like') {
          return -1;
        }
        if (bPreference === 'like' && aPreference !== 'like') {
          return 1;
        }
        
        if (aPreference === 'dislike' && bPreference !== 'dislike') {
          return 1;
        }
        if (bPreference === 'dislike' && aPreference !== 'dislike') {
          return -1;
        }
        
        return a.localeCompare(b, 'hu');
      });
    }
    
    return sortIngredientsByPreference(
      ingredients,
      (ingredient) => getFavoriteForIngredient(ingredient),
      (ingredient) => getPreferenceForIngredient(ingredient),
      categoryName
    );
  };

  const displayedIngredients = getSortedIngredients();

  if (displayedIngredients.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Nincs megjeleníthető alapanyag ebben a kategóriában.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
      {displayedIngredients.map((ingredient, index) => {
        const preference = getPreferenceForIngredient(ingredient);
        const favorite = getFavoriteForIngredient(ingredient);
        
        return (
          <IngredientCard
            key={ingredient}
            ingredient={ingredient}
            preference={preference}
            favorite={favorite}
            index={index}
            onPreferenceChange={onPreferenceChange}
            onFavoriteChange={onFavoriteChange}
          />
        );
      })}
    </div>
  );
}
