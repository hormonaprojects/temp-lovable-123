
import { Button } from "@/components/ui/button";
import { StarRating } from "./StarRating";
import { FavoriteButton } from "./FavoriteButton";
import { Recipe } from "@/types/recipe";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { LoadingChef } from "@/components/ui/LoadingChef";
import { X } from "lucide-react";

interface RecipeDisplayProps {
  recipe: Recipe | null;
  isLoading: boolean;
  onRegenerate: () => void;
  onNewRecipe: () => void;
  user: any;
}

export function RecipeDisplay({ recipe, isLoading, onRegenerate, onNewRecipe, user }: RecipeDisplayProps) {
  const [fullScreenModalOpen, setFullScreenModalOpen] = useState(false);
  const { toast } = useToast();
  const { saveRating } = useSupabaseData();

  const handleRating = async (rating: number) => {
    if (!recipe) return;

    const success = await saveRating(recipe.név, rating);
    
    if (success) {
      toast({
        title: "Köszönjük az értékelést!",
        description: `${rating}/5 csillag mentve az adatbázisba.`,
      });
    } else {
      toast({
        title: "Hiba",
        description: "Nem sikerült menteni az értékelést.",
        variant: "destructive"
      });
    }
  };

  const openFullScreenModal = () => {
    setFullScreenModalOpen(true);
  };

  const closeFullScreenModal = () => {
    setFullScreenModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <LoadingChef />
      </div>
    );
  }

  if (!recipe) {
    return null;
  }

  return (
    <>
      <div className="recipe-result bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-8 mb-6 sm:mb-8 mx-3 sm:mx-0">
        <div className="text-center mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-3xl font-bold text-white mb-2 sm:mb-4 px-2">🍽️ {recipe.név}</h2>
          
          {recipe.képUrl && (
            <div className="mb-4 sm:mb-6">
              <img 
                src={recipe.képUrl} 
                alt={recipe.név}
                className="max-w-full max-h-48 sm:max-h-64 mx-auto rounded-xl shadow-lg cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                onClick={openFullScreenModal}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">📝 Hozzávalók ({recipe.hozzávalók?.length || 0} db):</h3>
            <ul className="text-white/90 space-y-2">
              {recipe.hozzávalók?.map((ingredient, index) => (
                <li key={index} className="flex items-start text-sm sm:text-base">
                  <span className="text-green-400 mr-2">•</span>
                  {ingredient}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">👨‍🍳 Elkészítés:</h3>
            <div 
              className="text-white/90 leading-relaxed text-sm sm:text-base"
              dangerouslySetInnerHTML={{ 
                __html: recipe.elkészítés?.replace(/(\d+\.\s)/g, '<br><strong class="text-yellow-300">$1</strong>') || '' 
              }}
            />
          </div>
        </div>

        {(recipe.elkészítésiIdő || recipe.fehérje || recipe.szénhidrát || recipe.zsír) && (
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-white/20">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 text-center">📊 Tápértékek</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              {recipe.elkészítésiIdő && (
                <div className="bg-white/20 rounded-lg p-3 sm:p-4 text-center">
                  <div className="text-xl sm:text-2xl mb-1 sm:mb-2">⏱️</div>
                  <div className="text-white font-semibold text-xs sm:text-base">{recipe.elkészítésiIdő}</div>
                </div>
              )}
              {recipe.fehérje && (
                <div className="bg-white/20 rounded-lg p-3 sm:p-4 text-center">
                  <div className="text-xl sm:text-2xl mb-1 sm:mb-2">🥩</div>
                  <div className="text-white font-semibold text-xs sm:text-base">{recipe.fehérje}g fehérje</div>
                </div>
              )}
              {recipe.szénhidrát && (
                <div className="bg-white/20 rounded-lg p-3 sm:p-4 text-center">
                  <div className="text-xl sm:text-2xl mb-1 sm:mb-2">🍞</div>
                  <div className="text-white font-semibold text-xs sm:text-base">{recipe.szénhidrát}g szénhidrát</div>
                </div>
              )}
              {recipe.zsír && (
                <div className="bg-white/20 rounded-lg p-3 sm:p-4 text-center">
                  <div className="text-xl sm:text-2xl mb-1 sm:mb-2">🥑</div>
                  <div className="text-white font-semibold text-xs sm:text-base">{recipe.zsír}g zsír</div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-white/20">
          <div className="text-center mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">⭐ Értékeld a receptet:</h3>
            <StarRating 
              recipeName={recipe.név} 
              onRate={handleRating}
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-4 sm:mt-6">
            <Button
              onClick={onRegenerate}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
            >
              🔄 Másik hasonló
            </Button>
            <Button
              onClick={onNewRecipe}
              className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
            >
              🎯 Új recept
            </Button>
            <FavoriteButton user={user} recipe={recipe} />
          </div>
        </div>
      </div>

      {/* Full Screen Recipe Modal */}
      {fullScreenModalOpen && recipe && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={closeFullScreenModal}
        >
          <div className="relative max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto animate-scale-in">
            <button
              onClick={closeFullScreenModal}
              className="absolute -top-8 sm:-top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
            >
              <X className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
            
            <div className="bg-gradient-to-br from-indigo-600/90 to-purple-700/90 backdrop-blur-sm rounded-2xl p-4 sm:p-8 text-white shadow-2xl border border-white/20">
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4 sm:mb-6 px-2">🍽️ {recipe.név}</h2>
                
                {recipe.képUrl && (
                  <div className="mb-6 sm:mb-8">
                    <img 
                      src={recipe.képUrl} 
                      alt={recipe.név}
                      className="max-w-full max-h-60 sm:max-h-80 mx-auto rounded-2xl shadow-2xl border-4 border-white/30"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
                  <h3 className="text-lg sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                    📝 Hozzávalók ({recipe.hozzávalók?.length || 0} db)
                  </h3>
                  <ul className="text-white/90 space-y-2 sm:space-y-3">
                    {recipe.hozzávalók?.map((ingredient, index) => (
                      <li key={index} className="flex items-start bg-white/5 p-2 sm:p-3 rounded-lg">
                        <span className="text-green-400 mr-2 sm:mr-3 font-bold text-base sm:text-lg">•</span>
                        <span className="text-sm sm:text-lg">{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
                  <h3 className="text-lg sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                    👨‍🍳 Elkészítés
                  </h3>
                  <div 
                    className="text-white/90 leading-relaxed text-sm sm:text-lg"
                    dangerouslySetInnerHTML={{ 
                      __html: recipe.elkészítés?.replace(/(\d+\.\s)/g, '<br><strong class="text-yellow-300">$1</strong>') || '' 
                    }}
                  />
                </div>
              </div>

              {(recipe.elkészítésiIdő || recipe.fehérje || recipe.szénhidrát || recipe.zsír) && (
                <div className="mb-6 sm:mb-8">
                  <h3 className="text-lg sm:text-2xl font-bold text-white mb-4 sm:mb-6 text-center">📊 Tápértékek</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
                    {recipe.elkészítésiIdő && (
                      <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-4 sm:p-6 text-center border border-blue-300/30">
                        <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">⏱️</div>
                        <div className="text-white font-semibold text-sm sm:text-lg">{recipe.elkészítésiIdő}</div>
                      </div>
                    )}
                    {recipe.fehérje && (
                      <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm rounded-xl p-4 sm:p-6 text-center border border-red-300/30">
                        <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">🥩</div>
                        <div className="text-white font-semibold text-sm sm:text-lg">{recipe.fehérje}g fehérje</div>
                      </div>
                    )}
                    {recipe.szénhidrát && (
                      <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-sm rounded-xl p-4 sm:p-6 text-center border border-yellow-300/30">
                        <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">🍞</div>
                        <div className="text-white font-semibold text-sm sm:text-lg">{recipe.szénhidrát}g szénhidrát</div>
                      </div>
                    )}
                    {recipe.zsír && (
                      <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-xl p-4 sm:p-6 text-center border border-green-300/30">
                        <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">🥑</div>
                        <div className="text-white font-semibold text-sm sm:text-lg">{recipe.zsír}g zsír</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="text-center pt-4 sm:pt-6 border-t border-white/20">
                <h3 className="text-lg sm:text-2xl font-bold text-white mb-4 sm:mb-6">⭐ Értékeld a receptet:</h3>
                <StarRating 
                  recipeName={recipe.név} 
                  onRate={handleRating}
                />
              </div>
              
              <div className="text-center mt-6 sm:mt-8">
                <p className="text-white/70 text-sm sm:text-lg">Kattints bárhova a bezáráshoz</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
