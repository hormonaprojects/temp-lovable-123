
// Centralizált sorrendezési logika az alapanyagokhoz
export interface SortingParams {
  ingredient: string;
  isFavorite: boolean;
  preference: 'like' | 'dislike' | 'neutral';
}

export const sortIngredientsByPreference = (
  ingredients: string[],
  getFavoriteForIngredient: (ingredient: string, category?: string) => boolean,
  getPreferenceForIngredient: (ingredient: string, category?: string) => 'like' | 'dislike' | 'neutral',
  category?: string
): string[] => {
  console.log(`🔄 Centralizált sorrendezés kezdése - kategória: ${category || 'nincs'}`);
  
  return [...ingredients]
    .filter(ingredient => {
      // Elrejtjük a disliked alapanyagokat
      const preference = getPreferenceForIngredient(ingredient, category);
      const shouldKeep = preference !== 'dislike';
      
      if (!shouldKeep) {
        console.log(`❌ Kizárva (dislike): ${ingredient}`);
      }
      
      return shouldKeep;
    })
    .sort((a, b) => {
      const aIsFavorite = getFavoriteForIngredient(a, category);
      const bIsFavorite = getFavoriteForIngredient(b, category);
      const aPreference = getPreferenceForIngredient(a, category);
      const bPreference = getPreferenceForIngredient(b, category);
      
      console.log(`🔍 Összehasonlítás: ${a} (kedvenc: ${aIsFavorite}, pref: ${aPreference}) vs ${b} (kedvenc: ${bIsFavorite}, pref: ${bPreference})`);
      
      // ELSŐ PRIORITÁS: Kedvencek (rózsaszín szív) - MINDIG ELŐRE
      if (aIsFavorite !== bIsFavorite) {
        const result = aIsFavorite ? -1 : 1;
        console.log(`✨ Kedvenc alapú sorrend: ${aIsFavorite ? a : b} előre (${result})`);
        return result;
      }
      
      // MÁSODIK PRIORITÁS: Preferenciák (ha mindkettő kedvenc vagy mindkettő nem kedvenc)
      if (aPreference !== bPreference) {
        // Like preferencia előre megy
        if (aPreference === 'like' && bPreference !== 'like') {
          console.log(`💚 Like preferencia: ${a} előre (-1)`);
          return -1;
        }
        if (bPreference === 'like' && aPreference !== 'like') {
          console.log(`💚 Like preferencia: ${b} előre (1)`);
          return 1;
        }
        
        // Neutral vs semmi egyéb esetben
        if (aPreference === 'neutral' && bPreference !== 'neutral') {
          console.log(`😐 Neutral preferencia: ${a} előre (-1)`);
          return -1;
        }
        if (bPreference === 'neutral' && aPreference !== 'neutral') {
          console.log(`😐 Neutral preferencia: ${b} előre (1)`);
          return 1;
        }
      }
      
      // HARMADIK PRIORITÁS: Ábécé sorrend
      const result = a.localeCompare(b, 'hu');
      console.log(`📝 Ábécé sorrend: ${a} vs ${b} = ${result}`);
      return result;
    });
};
