
import { CombinedRecipe } from '@/types/newDatabase';
import { Recipe } from '@/types/recipe';

export const convertNewRecipeToStandard = (newRecipe: CombinedRecipe): Recipe => {
  return {
    név: newRecipe.név,
    elkészítés: newRecipe.elkészítés,
    kép: newRecipe.kép,
    szénhidrát: newRecipe.szénhidrát,
    fehérje: newRecipe.fehérje,
    zsír: newRecipe.zsír,
    hozzávalók: newRecipe.hozzávalók,
    mealTypes: newRecipe.mealTypes // Több meal type átadása
  };
};
