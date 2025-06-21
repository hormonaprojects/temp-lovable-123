
import { Recipe } from "@/types/recipe";
import { Clock, Users } from "lucide-react";

interface RecipeContentProps {
  recipe: Recipe;
  compact?: boolean;
  isFullScreen?: boolean;
}

export function RecipeContent({ recipe, compact = false, isFullScreen = false }: RecipeContentProps) {
  // Placeholder képek receptekhez
  const getRecipeImage = (recipeName: string) => {
    // Hash alapú kép kiválasztás a recept neve alapján
    const imageOptions = [
      'photo-1618160702438-9b02ab6515c9', // fekete és barna gyümölcs
      'photo-1465146344425-f00d5f5c8f07', // narancs virágok
      'photo-1721322800607-8c38375eef04'  // nappali
    ];
    
    const hash = recipeName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const imageIndex = Math.abs(hash) % imageOptions.length;
    return `https://images.unsplash.com/${imageOptions[imageIndex]}?auto=format&fit=crop&w=600&q=80`;
  };

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
    <div className="space-y-6">
      {/* Recept címe és képe */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center justify-center gap-2">
          🍽️ {recipe.név}
        </h2>
        
        {/* Recept kép */}
        <div className="w-full max-w-md mx-auto">
          <img
            src={getRecipeImage(recipe.név)}
            alt={recipe.név}
            className="w-full h-48 sm:h-64 object-cover rounded-2xl shadow-lg"
            onError={(e) => {
              // Fallback kép ha a fő kép nem töltődik be
              e.currentTarget.src = 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&w=600&q=80';
            }}
          />
        </div>

        {/* Főzési idő és adag */}
        <div className="flex justify-center gap-4 sm:gap-6 text-white/80">
          {recipe.főzésiIdő && (
            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{recipe.főzésiIdő}</span>
            </div>
          )}
          {recipe.adagok && (
            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
              <Users className="w-4 h-4" />
              <span className="text-sm">{recipe.adagok}</span>
            </div>
          )}
        </div>
      </div>

      {/* Hozzávalók */}
      <div className="bg-white/5 rounded-xl p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center gap-2">
          🥕 Hozzávalók:
        </h3>
        <ul className="space-y-2">
          {formatIngredients(recipe.hozzávalók).map((ingredient, index) => (
            <li key={index} className="text-white/90 flex items-start gap-2">
              <span className="text-yellow-400 mt-1">•</span>
              <span>{ingredient}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Elkészítés */}
      <div className="bg-white/5 rounded-xl p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center gap-2">
          👨‍🍳 Elkészítés:
        </h3>
        <div className="space-y-3">
          {formatInstructions(recipe.elkészítés).map((step, index) => (
            <div key={index} className="flex gap-3">
              <span className="bg-yellow-400 text-black text-sm font-bold px-2 py-1 rounded-full min-w-[24px] h-6 flex items-center justify-center">
                {index + 1}
              </span>
              <p className="text-white/90 flex-1 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
