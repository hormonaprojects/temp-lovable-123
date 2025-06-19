
import { Recipe } from "@/types/recipe";

interface NutritionInfoProps {
  recipe: Recipe;
}

export function NutritionInfo({ recipe }: NutritionInfoProps) {
  if (!recipe.elkészítésiIdő && !recipe.fehérje && !recipe.szénhidrát && !recipe.zsír) {
    return null;
  }

  return (
    <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/20">
      <h3 className="text-base sm:text-xl font-bold text-white mb-3 sm:mb-4 text-center">📊 Tápértékek</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {recipe.elkészítésiIdő && (
          <div className="bg-white/20 rounded-lg p-2 sm:p-4 text-center">
            <div className="text-lg sm:text-2xl mb-1 sm:mb-2">⏱️</div>
            <div className="text-white font-semibold text-xs sm:text-base leading-tight">{recipe.elkészítésiIdő}</div>
          </div>
        )}
        {recipe.fehérje && (
          <div className="bg-white/20 rounded-lg p-2 sm:p-4 text-center">
            <div className="text-lg sm:text-2xl mb-1 sm:mb-2">🥩</div>
            <div className="text-white font-semibold text-xs sm:text-base leading-tight">{recipe.fehérje}g<br className="sm:hidden" /> fehérje</div>
          </div>
        )}
        {recipe.szénhidrát && (
          <div className="bg-white/20 rounded-lg p-2 sm:p-4 text-center">
            <div className="text-lg sm:text-2xl mb-1 sm:mb-2">🍞</div>
            <div className="text-white font-semibold text-xs sm:text-base leading-tight">{recipe.szénhidrát}g<br className="sm:hidden" /> szénhidrát</div>
          </div>
        )}
        {recipe.zsír && (
          <div className="bg-white/20 rounded-lg p-2 sm:p-4 text-center">
            <div className="text-lg sm:text-2xl mb-1 sm:mb-2">🥑</div>
            <div className="text-white font-semibold text-xs sm:text-base leading-tight">{recipe.zsír}g<br className="sm:hidden" /> zsír</div>
          </div>
        )}
      </div>
    </div>
  );
}
