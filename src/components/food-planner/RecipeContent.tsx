
import { Recipe } from "@/types/recipe";
import { Clock, Users } from "lucide-react";

interface RecipeContentProps {
  recipe: Recipe;
  compact?: boolean;
  isFullScreen?: boolean;
}

export function RecipeContent({ recipe, compact = false, isFullScreen = false }: RecipeContentProps) {
  const formatIngredients = (ingredients: string[]) => {
    return ingredients
      .filter(ingredient => ingredient && ingredient.trim() !== '')
      .map(ingredient => ingredient.trim());
  };

  const formatInstructions = (instructions: string) => {
    if (!instructions) return [];
    
    // Számozott lépések keresése (1., 2., stb.)
    const numberedSteps = instructions.split(/\d+\./).filter(step => step.trim());
    if (numberedSteps.length > 1) {
      return numberedSteps.map(step => step.trim()).filter(step => step);
    }
    
    // Mondatok szétválasztása
    const sentences = instructions.split(/[.!?]+/).filter(sentence => sentence.trim());
    if (sentences.length > 1) {
      return sentences.map(sentence => sentence.trim()).filter(sentence => sentence);
    }
    
    // Ha nincs világos struktúra, az egészet egy lépésként visszaadjuk
    return [instructions.trim()];
  };

  // Compact mód a többnapos étrendtervezőhöz
  if (compact) {
    return (
      <div className="space-y-3">
        <h4 className="font-semibold text-white text-sm">{recipe.név}</h4>
        {(recipe.főzésiIdő || recipe.adagok) && (
          <div className="flex gap-2 text-xs text-white/70">
            {recipe.főzésiIdő && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {recipe.főzésiIdő}
              </span>
            )}
            {recipe.adagok && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {recipe.adagok}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Recept címe és képe */}
      <div className="text-center space-y-3 sm:space-y-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white flex items-center justify-center gap-2 px-2">
          🍽️ {recipe.név}
        </h2>
        
        {/* Recept kép - adatbázisból */}
        {recipe.képUrl && (
          <div className="w-full max-w-sm sm:max-w-md mx-auto px-4">
            <img
              src={recipe.képUrl}
              alt={recipe.név}
              className="w-full h-40 sm:h-48 md:h-64 object-cover rounded-xl sm:rounded-2xl shadow-lg"
              onError={(e) => {
                // Fallback kép ha a fő kép nem töltődik be
                e.currentTarget.src = 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=600&q=80';
              }}
            />
          </div>
        )}

        {/* Főzési idő és adag */}
        <div className="flex justify-center gap-3 sm:gap-4 text-white/80 px-4">
          {recipe.főzésiIdő && (
            <div className="flex items-center gap-2 bg-white/10 px-3 sm:px-4 py-2 rounded-lg">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">{recipe.főzésiIdő}</span>
            </div>
          )}
          {recipe.adagok && (
            <div className="flex items-center gap-2 bg-white/10 px-3 sm:px-4 py-2 rounded-lg">
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">{recipe.adagok}</span>
            </div>
          )}
        </div>
      </div>

      {/* Hozzávalók */}
      <div className="bg-white/5 rounded-lg sm:rounded-xl p-4 sm:p-6 mx-4 sm:mx-0">
        <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          🥕 Hozzávalók:
        </h3>
        <ul className="space-y-1 sm:space-y-2">
          {formatIngredients(recipe.hozzávalók).map((ingredient, index) => (
            <li key={index} className="text-white/90 flex items-start gap-2 text-sm sm:text-base">
              <span className="text-yellow-400 mt-1">•</span>
              <span>{ingredient}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Elkészítés */}
      <div className="bg-white/5 rounded-lg sm:rounded-xl p-4 sm:p-6 mx-4 sm:mx-0">
        <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          👨‍🍳 Elkészítés:
        </h3>
        <div className="space-y-2 sm:space-y-3">
          {formatInstructions(recipe.elkészítés).map((step, index) => (
            <div key={index} className="flex gap-2 sm:gap-3">
              <span className="bg-yellow-400 text-black text-xs sm:text-sm font-bold px-2 py-1 rounded-full min-w-[20px] sm:min-w-[24px] h-5 sm:h-6 flex items-center justify-center flex-shrink-0">
                {index + 1}
              </span>
              <p className="text-white/90 flex-1 leading-relaxed text-sm sm:text-base">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
