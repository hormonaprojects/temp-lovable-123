
import { IngredientCard } from "./IngredientCard";
import { sortIngredientsByPreference } from "@/services/ingredientSorting";

interface IngredientsGridProps {
  ingredients: string[];
  categoryName: string;
  getPreferenceForIngredient: (ingredient: string) => 'like' | 'dislike' | 'neutral';
  getFavoriteForIngredient: (ingredient: string) => boolean;
  onPreferenceChange: (ingredient: string, preference: 'like' | 'dislike' | 'neutral') => void;
  onFavoriteChange: (ingredient: string, isFavorite: boolean) => void;
  hideDisliked?: boolean; // Új prop a dislike-ok elrejtéséhez
}

export function IngredientsGrid({
  ingredients,
  categoryName,
  getPreferenceForIngredient,
  getFavoriteForIngredient,
  onPreferenceChange,
  onFavoriteChange,
  hideDisliked = true // Alapértelmezetten elrejtjük (mint eddig)
}: IngredientsGridProps) {
  console.log(`🎯 IngredientsGrid renderelés - kategória: ${categoryName}`);
  
  const getSortedIngredients = () => {
    console.log(`🔄 Sorrendezés kezdése - hideDisliked: ${hideDisliked}`);
    
    // Centralizált sorrendezés használata
    let sortedIngredients = sortIngredientsByPreference(
      ingredients,
      (ingredient) => getFavoriteForIngredient(ingredient),
      (ingredient) => getPreferenceForIngredient(ingredient),
      categoryName
    );

    // Ha hideDisliked false (mint a preference setup-nál), ne szűrjük ki a dislike-okat
    if (!hideDisliked) {
      console.log(`👁️ Dislike alapanyagok megjelenítése engedélyezve`);
      // Visszaadjuk az összes alapanyagot, de sorrendezve
      sortedIngredients = [...ingredients].sort((a, b) => {
        const aIsFavorite = getFavoriteForIngredient(a);
        const bIsFavorite = getFavoriteForIngredient(b);
        const aPreference = getPreferenceForIngredient(a);
        const bPreference = getPreferenceForIngredient(b);
        
        // Kedvencek előre
        if (aIsFavorite !== bIsFavorite) {
          return aIsFavorite ? -1 : 1;
        }
        
        // Like előre
        if (aPreference === 'like' && bPreference !== 'like') {
          return -1;
        }
        if (bPreference === 'like' && aPreference !== 'like') {
          return 1;
        }
        
        // Dislike hátra
        if (aPreference === 'dislike' && bPreference !== 'dislike') {
          return 1;
        }
        if (bPreference === 'dislike' && aPreference !== 'dislike') {
          return -1;
        }
        
        // Ábécé sorrend
        return a.localeCompare(b, 'hu');
      });
    }
    
    console.log(`✅ Végleges sorrendezett alapanyagok (${sortedIngredients.length}):`, sortedIngredients.slice(0, 5));
    return sortedIngredients;
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
        
        console.log(`🎨 IngredientsGrid - Renderelés: ${ingredient} - kedvenc: ${favorite}, preferencia: ${preference}`);
        
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
