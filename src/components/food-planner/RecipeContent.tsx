
import { Recipe } from "@/types/recipe";
import { Clock, Users, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RecipeContentProps {
  recipe: Recipe;
  compact?: boolean;
}

export function RecipeContent({ recipe, compact = false }: RecipeContentProps) {
  const containerClass = compact 
    ? "space-y-2" 
    : "space-y-4 sm:space-y-6 cursor-pointer hover:bg-white/5 rounded-xl p-2 sm:p-4 transition-all duration-200";

  const titleClass = compact
    ? "text-lg font-bold text-white mb-2"
    : "text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4 text-center";

  const metaClass = compact
    ? "flex flex-wrap gap-2 text-xs"
    : "flex flex-wrap justify-center gap-2 sm:gap-4 mb-4 sm:mb-6";

  const ingredientsClass = compact
    ? "text-sm"
    : "mb-4 sm:mb-6";

  const instructionsClass = compact
    ? "text-sm"
    : "";

  return (
    <div className={containerClass}>
      <h2 className={titleClass}>
        🍽️ {recipe.név}
      </h2>

      {/* Recipe Meta Info */}
      <div className={metaClass}>
        {recipe.elkészítési_idő && (
          <Badge variant="secondary" className="bg-green-600/30 text-green-200 border-green-400/50">
            <Clock className={compact ? "w-3 h-3 mr-1" : "w-4 h-4 mr-1"} />
            {recipe.elkészítési_idő}
          </Badge>
        )}
        <Badge variant="secondary" className="bg-blue-600/30 text-blue-200 border-blue-400/50">
          <Users className={compact ? "w-3 h-3 mr-1" : "w-4 h-4 mr-1"} />
          4 adag
        </Badge>
        <Badge variant="secondary" className="bg-yellow-600/30 text-yellow-200 border-yellow-400/50">
          <Star className={compact ? "w-3 h-3 mr-1" : "w-4 h-4 mr-1"} />
          {recipe.kategória || 'Házi készítésű'}
        </Badge>
      </div>

      {/* Ingredients */}
      <div className={ingredientsClass}>
        <h3 className={`font-semibold text-green-400 mb-2 ${compact ? 'text-sm' : 'text-lg sm:text-xl'}`}>
          🥕 Hozzávalók:
        </h3>
        <div className={`grid gap-1 ${compact ? 'text-xs' : 'grid-cols-1 sm:grid-cols-2 text-sm sm:text-base'}`}>
          {recipe.hozzávalók.map((ingredient, index) => (
            <div key={index} className="text-white/90 flex items-center">
              <span className="text-green-400 mr-2">•</span>
              {ingredient}
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      {recipe.elkészítés && (
        <div className={instructionsClass}>
          <h3 className={`font-semibold text-blue-400 mb-2 ${compact ? 'text-sm' : 'text-lg sm:text-xl'}`}>
            👨‍🍳 Elkészítés:
          </h3>
          <div className={`text-white/90 whitespace-pre-line leading-relaxed ${compact ? 'text-xs' : 'text-sm sm:text-base'}`}>
            {recipe.elkészítés}
          </div>
        </div>
      )}
    </div>
  );
}
