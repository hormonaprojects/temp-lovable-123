import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { LoadingChef } from "@/components/ui/LoadingChef";
import { Recipe } from "@/types/recipe";
import { RecipeDisplay } from "./RecipeDisplay";
import { RecipeForm } from "./RecipeForm";

interface SingleRecipeAppProps {
  user?: any;
  onGenerateSimilar?: (recipe: any, mealType?: string) => void;
}

export function SingleRecipeApp({ user, onGenerateSimilar }: SingleRecipeAppProps) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { getRandomRecipe, convertToStandardRecipe } = useSupabaseData();

  const generateRecipe = async () => {
    setIsLoading(true);
    try {
      const newRecipe = getRandomRecipe();
      if (newRecipe) {
        const convertedRecipe = convertToStandardRecipe(newRecipe);
        setRecipe(convertedRecipe);
      } else {
        toast({
          title: "Nincs recept",
          description: "Sajnáljuk, nem találtunk receptet.",
        });
        setRecipe(null);
      }
    } catch (error) {
      toast({
        title: "Hiba",
        description: "Recept generálása sikertelen.",
        variant: "destructive",
      });
      setRecipe(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewRecipe = (newRecipe: Recipe) => {
    setRecipe(newRecipe);
  };

  const handleGenerateSimilar = () => {
    if (recipe && onGenerateSimilar) {
      onGenerateSimilar(recipe);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <header className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-center mb-4">Recept Generátor</h1>
      </header>

      <RecipeForm onGenerate={generateRecipe} onNewRecipe={handleNewRecipe} />

      <RecipeDisplay
        recipe={recipe}
        isLoading={isLoading}
        onRegenerate={generateRecipe}
        onNewRecipe={handleNewRecipe}
        onGenerateSimilar={handleGenerateSimilar}
        user={user}
      />
    </div>
  );
}
