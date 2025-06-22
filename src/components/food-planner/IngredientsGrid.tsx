
import { IngredientCard } from "./IngredientCard";

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

  // Javított sorrendezés: kedvencek ELŐSZÖR, majd liked, majd neutral (disliked elrejtése)
  const sortedIngredients = [...ingredients]
    .filter(ingredient => {
      const preference = getPreferenceForIngredient(ingredient);
      return preference !== 'dislike'; // Elrejtjük a disliked alapanyagokat
    })
    .sort((a, b) => {
      const aIsFavorite = getFavoriteForIngredient(a);
      const bIsFavorite = getFavoriteForIngredient(b);
      const aPreference = getPreferenceForIngredient(a);
      const bPreference = getPreferenceForIngredient(b);
      
      console.log(`🔍 Sorrendezés: ${a} (kedvenc: ${aIsFavorite}, pref: ${aPreference}) vs ${b} (kedvenc: ${bIsFavorite}, pref: ${bPreference})`);
      
      // ELSŐ PRIORITÁS: kedvencek (rózsaszín szív)
      if (aIsFavorite && !bIsFavorite) {
        console.log(`✨ ${a} kedvenc, előre kerül`);
        return -1;
      }
      if (!aIsFavorite && bIsFavorite) {
        console.log(`✨ ${b} kedvenc, előre kerül`);
        return 1;
      }
      
      // Ha mindkettő kedvenc vagy mindkettő nem kedvenc, akkor preferencia szerint
      if (!aIsFavorite && !bIsFavorite) {
        // MÁSODIK PRIORITÁS: liked alapanyagok (zöld színű)
        if (aPreference === 'like' && bPreference !== 'like') {
          console.log(`💚 ${a} liked, előre kerül`);
          return -1;
        }
        if (aPreference !== 'like' && bPreference === 'like') {
          console.log(`💚 ${b} liked, előre kerül`);
          return 1;
        }
      }
      
      // HARMADIK PRIORITÁS: ábécé sorrend ugyanazon szinten
      const result = a.localeCompare(b, 'hu');
      console.log(`📝 Ábécé sorrend: ${a} vs ${b} = ${result}`);
      return result;
    });

  console.log(`🎯 Végső sorrendezett lista (${categoryName}):`, sortedIngredients);

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
