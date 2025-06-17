
import { Button } from "@/components/ui/button";
import { StarRating } from "./StarRating";
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
}

export function RecipeDisplay({ recipe, isLoading, onRegenerate, onNewRecipe }: RecipeDisplayProps) {
  const [imageModalOpen, setImageModalOpen] = useState(false);
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

  const openImageModal = () => {
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
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
    <div className="recipe-result bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-white mb-4">🍽️ {recipe.név}</h2>
        
        {recipe.képUrl && (
          <div className="mb-6">
            <img 
              src={recipe.képUrl} 
              alt={recipe.név}
              className="max-w-full max-h-64 mx-auto rounded-xl shadow-lg cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              onClick={openImageModal}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-bold text-white mb-4">📝 Hozzávalók ({recipe.hozzávalók?.length || 0} db):</h3>
          <ul className="text-white/90 space-y-2">
            {recipe.hozzávalók?.map((ingredient, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-400 mr-2">•</span>
                {ingredient}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-bold text-white mb-4">👨‍🍳 Elkészítés:</h3>
          <div 
            className="text-white/90 leading-relaxed"
            dangerouslySetInnerHTML={{ 
              __html: recipe.elkészítés?.replace(/(\d+\.\s)/g, '<br><strong>$1</strong>') || '' 
            }}
          />
        </div>
      </div>

      {(recipe.elkészítésiIdő || recipe.fehérje || recipe.szénhidrát || recipe.zsír) && (
        <div className="mt-8 pt-6 border-t border-white/20">
          <h3 className="text-xl font-bold text-white mb-4 text-center">📊 Tápértékek</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recipe.elkészítésiIdő && (
              <div className="bg-white/20 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">⏱️</div>
                <div className="text-white font-semibold">{recipe.elkészítésiIdő}</div>
              </div>
            )}
            {recipe.fehérje && (
              <div className="bg-white/20 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🥩</div>
                <div className="text-white font-semibold">{recipe.fehérje}g fehérje</div>
              </div>
            )}
            {recipe.szénhidrát && (
              <div className="bg-white/20 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🍞</div>
                <div className="text-white font-semibold">{recipe.szénhidrát}g szénhidrát</div>
              </div>
            )}
            {recipe.zsír && (
              <div className="bg-white/20 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🥑</div>
                <div className="text-white font-semibold">{recipe.zsír}g zsír</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-white/20">
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-white mb-4">⭐ Értékeld a receptet:</h3>
          <StarRating 
            recipeName={recipe.név} 
            onRate={handleRating}
          />
        </div>

        <div className="flex justify-center gap-4 mt-6">
          <Button
            onClick={onRegenerate}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            🔄 Másik hasonló
          </Button>
          <Button
            onClick={onNewRecipe}
            className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            🎯 Új recept
          </Button>
        </div>
      </div>

      {/* Enhanced Image Modal */}
      {imageModalOpen && recipe.képUrl && (
        <div 
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={closeImageModal}
        >
          <div className="relative max-w-90vw max-h-90vh text-center animate-scale-in">
            <button
              onClick={closeImageModal}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            <img 
              src={recipe.képUrl} 
              alt={recipe.név}
              className="max-w-full max-h-80vh rounded-2xl shadow-2xl"
            />
            <div className="text-white text-xl mt-4 font-semibold">{recipe.név}</div>
            <div className="text-white/70 text-sm mt-2">Kattints bárhová a bezáráshoz</div>
          </div>
        </div>
      )}
    </div>
  );
}
