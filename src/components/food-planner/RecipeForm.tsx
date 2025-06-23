
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChefHat } from "lucide-react";
import { Recipe } from "@/types/recipe";

interface RecipeFormProps {
  onGenerate: () => void;
  onNewRecipe: (recipe: Recipe) => void;
}

export function RecipeForm({ onGenerate }: RecipeFormProps) {
  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl mb-6">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <ChefHat className="w-5 h-5 text-yellow-400" />
          Recept Generálás
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={onGenerate}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          Új Recept Generálása
        </Button>
      </CardContent>
    </Card>
  );
}
