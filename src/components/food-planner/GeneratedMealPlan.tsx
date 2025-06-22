
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RecipeDisplay } from "./RecipeDisplay";

interface GeneratedMealPlanProps {
  generatedRecipes: any[];
  user: any;
}

const mealTypes = [
  { key: 'reggeli', label: 'Reggeli', emoji: '🍳' },
  { key: 'tízórai', label: 'Tízórai', emoji: '🥪' },
  { key: 'ebéd', label: 'Ebéd', emoji: '🍽️' },
  { key: 'uzsonna', label: 'Uzsonna', emoji: '🧁' },
  { key: 'vacsora', label: 'Vacsora', emoji: '🌮' }
];

export function GeneratedMealPlan({ generatedRecipes, user }: GeneratedMealPlanProps) {
  if (generatedRecipes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center text-gray-800">
        🍽️ Generált Napi Étrend
      </h2>
      <div className="grid gap-6">
        {generatedRecipes.map((recipe, index) => (
          <Card key={index} className="overflow-hidden border-2 border-purple-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl text-purple-800 capitalize flex items-center gap-2">
                    {mealTypes.find(m => m.key === recipe.mealType)?.emoji} {recipe.mealType}
                  </CardTitle>
                  <CardDescription className="flex gap-2 mt-2">
                    <Badge variant="secondary">{recipe.category}</Badge>
                    <Badge variant="outline">{recipe.ingredient}</Badge>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <RecipeDisplay
                recipe={recipe}
                isLoading={false}
                onRegenerate={() => {}}
                onNewRecipe={() => {}}
                user={user}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
