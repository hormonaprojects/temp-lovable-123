
import { StarRating } from "./StarRating";
import { FavoriteButton } from "./FavoriteButton";
import { Recipe } from "@/types/recipe";

interface RecipeActionsProps {
  recipe: Recipe;
  user: any;
  onRegenerate: () => void;
  onNewRecipe: () => void;
  onRating: (rating: number) => void;
  isFullScreen?: boolean;
  showButtons?: boolean;
}

export function RecipeActions({ 
  recipe, 
  user, 
  onRegenerate, 
  onNewRecipe, 
  onRating, 
  isFullScreen = false,
  showButtons = true
}: RecipeActionsProps) {
  const titleClass = isFullScreen
    ? "text-base sm:text-xl font-bold text-white mb-3 sm:mb-4"
    : "text-sm sm:text-base font-bold text-white mb-2 sm:mb-3";

  return (
    <div className={`${isFullScreen ? 'text-center pt-3 sm:pt-4 border-t border-white/20' : 'mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/20'}`}>
      <div className="text-center mb-2 sm:mb-3">
        <h3 className={titleClass}>⭐ Értékeld a receptet:</h3>
        <StarRating 
          recipeName={recipe.név} 
          onRate={onRating}
        />
      </div>

      {showButtons && !isFullScreen && (
        <div className="flex justify-center gap-2 mt-2 sm:mt-3">
          <FavoriteButton user={user} recipe={recipe} />
        </div>
      )}
    </div>
  );
}
