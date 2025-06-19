
import { Recipe } from "@/types/recipe";

interface RecipeContentProps {
  recipe: Recipe;
  isFullScreen?: boolean;
}

export function RecipeContent({ recipe, isFullScreen = false }: RecipeContentProps) {
  const titleClass = isFullScreen 
    ? "text-xl sm:text-4xl font-bold text-white mb-4 sm:mb-6 px-2" 
    : "text-lg sm:text-3xl font-bold text-white mb-2 sm:mb-4 px-2";
  
  const imageClass = isFullScreen
    ? "max-w-full max-h-48 sm:max-h-80 mx-auto rounded-2xl shadow-2xl border-4 border-white/30"
    : "max-w-full max-h-32 sm:max-h-64 mx-auto rounded-xl shadow-lg cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl";

  const containerClass = isFullScreen
    ? "bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-6 border border-white/20"
    : "";

  const headingClass = isFullScreen
    ? "text-base sm:text-2xl font-bold text-white mb-3 sm:mb-6 flex items-center gap-2 sm:gap-3"
    : "text-sm sm:text-xl font-bold text-white mb-2 sm:mb-4";

  const textClass = isFullScreen
    ? "text-white/90 leading-relaxed text-xs sm:text-lg"
    : "text-white/90 leading-relaxed text-xs sm:text-base";

  const ingredientClass = isFullScreen
    ? "flex items-start bg-white/5 p-2 sm:p-3 rounded-lg"
    : "flex items-start text-xs sm:text-base";

  return (
    <>
      <div className="text-center mb-3 sm:mb-6">
        <h2 className={titleClass}>🍽️ {recipe.név}</h2>
        
        {recipe.képUrl && (
          <div className="mb-3 sm:mb-6">
            <img 
              src={recipe.képUrl} 
              alt={recipe.név}
              className={imageClass}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-8">
        <div className={containerClass}>
          <h3 className={headingClass}>
            📝 Hozzávalók ({recipe.hozzávalók?.length || 0} db)
            {isFullScreen ? "" : ":"}
          </h3>
          <ul className="text-white/90 space-y-1 sm:space-y-3">
            {recipe.hozzávalók?.map((ingredient, index) => (
              <li key={index} className={ingredientClass}>
                <span className="text-green-400 mr-2 sm:mr-3 font-bold text-sm sm:text-lg">•</span>
                <span className="text-xs sm:text-lg leading-tight">{ingredient}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={containerClass}>
          <h3 className={headingClass}>
            👨‍🍳 Elkészítés
            {isFullScreen ? "" : ":"}
          </h3>
          <div 
            className={textClass}
            dangerouslySetInnerHTML={{ 
              __html: recipe.elkészítés?.replace(/(\d+\.\s)/g, '<br><strong class="text-yellow-300">$1</strong>') || '' 
            }}
          />
        </div>
      </div>
    </>
  );
}
