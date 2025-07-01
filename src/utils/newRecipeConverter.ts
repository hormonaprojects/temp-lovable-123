
import { CombinedRecipe } from '@/types/newDatabase';
import { Recipe } from '@/types/recipe';

export const convertNewRecipeToStandard = (newRecipe: CombinedRecipe): Recipe => {
  return {
    név: newRecipe.név,
    hozzávalók: newRecipe.hozzávalók,
    elkészítés: newRecipe.elkészítés,
    elkészítésiIdő: 'Ismeretlen', // Nincs ez az adat az új struktúrában
    fehérje: newRecipe.fehérje.toString() + 'g',
    szénhidrát: newRecipe.szénhidrát.toString() + 'g',
    zsír: newRecipe.zsír.toString() + 'g',
    képUrl: newRecipe.kép || ''
  };
};
