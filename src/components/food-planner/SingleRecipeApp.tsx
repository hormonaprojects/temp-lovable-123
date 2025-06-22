import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { MealTypeSelector } from "./MealTypeSelector";
import { CategoryIngredientSelector } from "./CategoryIngredientSelector";
import { MultiCategoryIngredientSelector } from "./MultiCategoryIngredientSelector";
import { RecipeDisplay } from "./RecipeDisplay";
import { DailyMealPlanner } from "./DailyMealPlanner";
import { MultiDayMealPlanGenerator } from "./MultiDayMealPlanGenerator";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { SupabaseRecipe } from "@/types/supabase";
import { Button } from "@/components/ui/button";
import { ChefHat, Calendar, CalendarDays, Sparkles } from "lucide-react";

interface User {
  id: string;
  email: string;
  fullName: string;
}

interface SingleRecipeAppProps {
  user: User;
}

type ViewMode = 'meal-selection' | 'category-selection' | 'multi-category-selection' | 'daily-planner' | 'multi-day-planner';

export function SingleRecipeApp({ user }: SingleRecipeAppProps) {
  const [currentView, setCurrentView] = useState<ViewMode>('meal-selection');
  const [selectedMealType, setSelectedMealType] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedIngredient, setSelectedIngredient] = useState<string>('');
  const [currentRecipe, setCurrentRecipe] = useState<SupabaseRecipe | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const {
    categories,
    mealTypes,
    loading,
    getRecipesByMealType,
    getRecipesByCategory,
    getFilteredIngredients,
    convertToStandardRecipe,
    saveRating,
    getFavoriteForIngredient,
    handleFavoriteToggle,
    userPreferences
  } = useSupabaseData(user?.id);

  const handleMealTypeSelect = async (mealType: string) => {
    console.log('🍽️ Ételtípus kiválasztva:', mealType);
    setSelectedMealType(mealType);
    setIsGenerating(true);
    
    try {
      const recipes = getRecipesByMealType(mealType);
      console.log('📋 Talált receptek:', recipes.length);
      
      if (recipes.length > 0) {
        const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
        console.log('🎲 Kiválasztott recept:', randomRecipe['Recept_Neve']);
        setCurrentRecipe(randomRecipe);
      } else {
        console.log('❌ Nincs recept ehhez az ételtípushoz');
        toast({
          title: "Nincs recept",
          description: `Nem található recept ehhez az ételtípushoz: ${mealType}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Recept keresési hiba:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült receptet keresni.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setCurrentView('category-selection');
  };

  const handleIngredientSelect = async (ingredient: string) => {
    console.log('🥕 Alapanyag kiválasztva:', ingredient, 'kategória:', selectedCategory);
    setSelectedIngredient(ingredient);
    setIsGenerating(true);
    
    try {
      const recipes = getRecipesByCategory(selectedCategory, ingredient, selectedMealType);
      console.log('📋 Talált receptek:', recipes.length);
      
      if (recipes.length > 0) {
        const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
        console.log('🎲 Kiválasztott recept:', randomRecipe['Recept_Neve']);
        setCurrentRecipe(randomRecipe);
      } else {
        console.log('❌ Nincs recept ehhez az alapanyaghoz');
        toast({
          title: "Nincs recept",
          description: `Nem található recept ehhez az alapanyaghoz: ${ingredient}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Recept keresési hiba:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült receptet keresni.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getRandomRecipe = async () => {
    setIsGenerating(true);
    try {
      const recipes = getRecipesByMealType(selectedMealType);
      if (recipes.length > 0) {
        const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
        setCurrentRecipe(randomRecipe);
        toast({
          title: "Új recept!",
          description: `${randomRecipe['Recept_Neve']} - Jó étvágyat!`,
        });
      }
    } catch (error) {
      console.error('❌ Véletlenszerű recept hiba:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült új receptet keresni.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGetMultipleCategoryRecipes = async (selectedIngredients: { category: string; ingredient: string }[]) => {
    console.log('🎯 Több kategóriás recept generálás:', selectedIngredients);
    setIsGenerating(true);
    
    try {
      // Összes lehetséges recept lekérése az adott ételtípushoz
      const allRecipes = getRecipesByMealType(selectedMealType);
      console.log('📋 Összes recept az ételtípushoz:', allRecipes.length);
      
      // Olyan receptek keresése, amelyek tartalmazzák a kiválasztott alapanyagokat
      const matchingRecipes = allRecipes.filter(recipe => {
        const recipeIngredients = [
          recipe['Hozzavalo_1'], recipe['Hozzavalo_2'], recipe['Hozzavalo_3'],
          recipe['Hozzavalo_4'], recipe['Hozzavalo_5'], recipe['Hozzavalo_6'],
          recipe['Hozzavalo_7'], recipe['Hozzavalo_8'], recipe['Hozzavalo_9'],
          recipe['Hozzavalo_10'], recipe['Hozzavalo_11'], recipe['Hozzavalo_12'],
          recipe['Hozzavalo_13'], recipe['Hozzavalo_14'], recipe['Hozzavalo_15'],
          recipe['Hozzavalo_16'], recipe['Hozzavalo_17'], recipe['Hozzavalo_18']
        ].filter(Boolean).map(ing => ing?.toLowerCase() || '');
        
        // Ellenőrizzük, hogy a recept tartalmaz-e legalább egy kiválasztott alapanyagot
        const hasSelectedIngredient = selectedIngredients.some(selected => 
          recipeIngredients.some(recipeIng => 
            recipeIng.includes(selected.ingredient.toLowerCase()) || 
            selected.ingredient.toLowerCase().includes(recipeIng)
          )
        );
        
        return hasSelectedIngredient;
      });
      
      console.log('🎯 Megfelelő receptek:', matchingRecipes.length);
      
      if (matchingRecipes.length > 0) {
        const randomRecipe = matchingRecipes[Math.floor(Math.random() * matchingRecipes.length)];
        console.log('🎲 Kiválasztott recept:', randomRecipe['Recept_Neve']);
        setCurrentRecipe(randomRecipe);
        
        toast({
          title: "Recept generálva!",
          description: `${randomRecipe['Recept_Neve']} - ${selectedIngredients.length} kiválasztott alapanyag alapján`,
        });
      } else {
        console.log('❌ Nincs megfelelő recept');
        toast({
          title: "Nincs megfelelő recept",
          description: `Nem található recept a kiválasztott alapanyagokkal: ${selectedIngredients.map(item => item.ingredient).join(', ')}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Több kategóriás recept generálási hiba:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült receptet generálni a kiválasztott alapanyagokból.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getPreferenceForIngredient = (ingredient: string, category: string): 'like' | 'dislike' | 'neutral' => {
    if (!userPreferences.length) return 'neutral';
    
    const preference = userPreferences.find(pref => 
      pref.category === category && pref.ingredient === ingredient
    );
    
    return preference ? preference.preference : 'neutral';
  };

  const resetToMealSelection = () => {
    setCurrentView('meal-selection');
    setSelectedMealType('');
    setSelectedCategory('');
    setSelectedIngredient('');
    setCurrentRecipe(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Betöltés...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header with navigation buttons */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            🍽️ Recept Generátor
          </h1>
          
          {/* Main Navigation */}
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <Button
              onClick={() => setCurrentView('meal-selection')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                currentView === 'meal-selection'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
              }`}
            >
              <ChefHat className="mr-2 h-5 w-5" />
              Ételtípus választás
            </Button>
            
            <Button
              onClick={() => setCurrentView('multi-category-selection')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                currentView === 'multi-category-selection'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
              }`}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Alapanyag szerinti generálás
            </Button>
            
            <Button
              onClick={() => setCurrentView('daily-planner')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                currentView === 'daily-planner'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
              }`}
            >
              <Calendar className="mr-2 h-5 w-5" />
              Napi étrendtervező
            </Button>
            
            <Button
              onClick={() => setCurrentView('multi-day-planner')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                currentView === 'multi-day-planner'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
              }`}
            >
              <CalendarDays className="mr-2 h-5 w-5" />
              Többnapos étrendtervező
            </Button>
          </div>
        </div>

        {/* Content based on current view */}
        {currentView === 'meal-selection' && (
          <>
            <MealTypeSelector
              mealTypes={Object.keys(mealTypes)}
              onMealTypeSelect={handleMealTypeSelect}
              selectedMealType={selectedMealType}
              isGenerating={isGenerating}
            />
            
            {currentRecipe && (
              <RecipeDisplay
                recipe={convertToStandardRecipe(currentRecipe)}
                isLoading={isGenerating}
                onRegenerate={getRandomRecipe}
                onNewRecipe={getRandomRecipe}
                user={user}
                getFavoriteForIngredient={getFavoriteForIngredient}
                onFavoriteToggle={handleFavoriteToggle}
              />
            )}
          </>
        )}

        {currentView === 'category-selection' && (
          <CategoryIngredientSelector
            selectedMealType={selectedMealType}
            foodData={{
              mealTypes,
              categories,
              getFilteredIngredients,
              getRecipesByMealType
            }}
            onGetRecipe={handleIngredientSelect}
            getFavoriteForIngredient={getFavoriteForIngredient}
            isGenerating={isGenerating}
          />
        )}

        {currentView === 'multi-category-selection' && (
          <>
            {!selectedMealType ? (
              <MealTypeSelector
                mealTypes={Object.keys(mealTypes)}
                onMealTypeSelect={(mealType) => {
                  setSelectedMealType(mealType);
                }}
                selectedMealType={selectedMealType}
                isGenerating={false}
              />
            ) : (
              <MultiCategoryIngredientSelector
                selectedMealType={selectedMealType}
                foodData={{
                  mealTypes,
                  categories,
                  getFilteredIngredients,
                  getRecipesByMealType
                }}
                onGetMultipleCategoryRecipes={handleGetMultipleCategoryRecipes}
                getFavoriteForIngredient={getFavoriteForIngredient}
                getPreferenceForIngredient={getPreferenceForIngredient}
              />
            )}
            
            {currentRecipe && (
              <RecipeDisplay
                recipe={convertToStandardRecipe(currentRecipe)}
                isLoading={isGenerating}
                onRegenerate={getRandomRecipe}
                onNewRecipe={getRandomRecipe}
                user={user}
                getFavoriteForIngredient={getFavoriteForIngredient}
                onFavoriteToggle={handleFavoriteToggle}
              />
            )}
          </>
        )}

        {currentView === 'daily-planner' && (
          <DailyMealPlanner
            user={user}
            mealTypes={mealTypes}
            categories={categories}
            getRecipesByMealType={getRecipesByMealType}
            getRecipesByCategory={getRecipesByCategory}
            getFilteredIngredients={getFilteredIngredients}
            convertToStandardRecipe={convertToStandardRecipe}
            saveRating={saveRating}
            getFavoriteForIngredient={getFavoriteForIngredient}
            onFavoriteToggle={handleFavoriteToggle}
          />
        )}

        {currentView === 'multi-day-planner' && (
          <MultiDayMealPlanGenerator
            user={user}
            mealTypes={mealTypes}
            getRecipesByMealType={getRecipesByMealType}
            convertToStandardRecipe={convertToStandardRecipe}
            saveRating={saveRating}
            getFavoriteForIngredient={getFavoriteForIngredient}
            onFavoriteToggle={handleFavoriteToggle}
          />
        )}
      </div>
    </div>
  );
}
